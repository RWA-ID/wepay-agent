import { pinata } from "../utils/ipfs.js";
import { db } from "../db.js";
import { logger } from "../utils/logger.js";
import { pinUserData } from "../utils/ipfs.js";

const PINATA_API = "https://agents.pinata.cloud/v0";
// ClawHub slug for the lobstercash skill (crossmint/lobstercash)
const LOBSTER_HUB_SLUG = "crossmint/lobstercash";
// IPFS CID for the custom WePay bill-pay skill (set after running scripts/pin-wepay-skill.ts)
const WEPAY_SKILL_CID = process.env.WEPAY_SKILL_CID ?? "";

function pinataHeaders() {
  return {
    Authorization: `Bearer ${process.env.PINATA_JWT}`,
    "Content-Type": "application/json",
  };
}

export class PinataAgentService {
  /**
   * Provision a dedicated OpenClaw agent for a new WePay user on Pinata Agents.
   * Each user gets their own isolated container.
   * Called automatically after payment confirmation if no agent is provisioned yet.
   */
  static async provisionAgent(userId: string): Promise<{ agentId: string }> {
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });

    // 1. Create the agent
    const createRes = await fetch(`${PINATA_API}/agents`, {
      method: "POST",
      headers: pinataHeaders(),
      body: JSON.stringify({
        name:        `wepay-${user.handle ?? userId.slice(0, 8)}`,
        description: `WePay personal finance agent for user ${userId}`,
        emoji:       "💸",
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      logger.error("Failed to provision Pinata agent", { userId, err });
      throw new Error(`Pinata agent provisioning failed: ${err}`);
    }

    const createData = (await createRes.json()) as { success: boolean; agent: { agentId: string } };
    const agentId = createData.agent.agentId;

    await db.user.update({ where: { id: userId }, data: { pinataAgentId: agentId } });
    logger.info("Pinata agent provisioned", { userId, agentId });

    // 2. Install skills (non-fatal — agent still works without them)
    const skillInstalls = [
      // WePay bill-pay custom skill (CID pinned via scripts/pin-wepay-skill.ts)
      WEPAY_SKILL_CID
        ? PinataAgentService.attachSkillCid(agentId, WEPAY_SKILL_CID)
            .then(() => logger.info("WePay bill-pay skill attached", { userId, agentId }))
            .catch((err: unknown) => logger.warn("WePay skill attach failed", { userId, agentId, err }))
        : Promise.resolve().then(() => logger.warn("WEPAY_SKILL_CID not set — skipping custom skill", { userId })),

      // Lobstercash ClawHub skill for fiat virtual card payments
      PinataAgentService.installLobsterSkill(agentId)
        .then(() => logger.info("Lobstercash skill installed", { userId, agentId }))
        .catch((err: unknown) => logger.warn("Lobstercash skill installation failed", { userId, agentId, err })),
    ];

    await Promise.allSettled(skillInstalls);

    return { agentId };
  }

  /**
   * Install the lobstercash ClawHub skill and attach it to the given agent.
   * Idempotent — safe to call multiple times.
   */
  static async installLobsterSkill(agentId: string): Promise<void> {
    // Step A: look up the hub skill to get its ID
    const hubRes = await fetch(`${PINATA_API}/clawhub/${LOBSTER_HUB_SLUG}`, {
      headers: pinataHeaders(),
    });

    if (!hubRes.ok) {
      throw new Error(`ClawHub lookup failed for ${LOBSTER_HUB_SLUG}: ${await hubRes.text()}`);
    }

    const hubData = (await hubRes.json()) as {
      hubSkill?: { hubSkillId: string };
      communityHubSkill?: { hubSkillId: string };
    };
    const hubSkillId = hubData.hubSkill?.hubSkillId ?? hubData.communityHubSkill?.hubSkillId;
    if (!hubSkillId) throw new Error(`No hubSkillId found for ${LOBSTER_HUB_SLUG}`);

    // Step B: install to our skill library (returns existing entry if already installed)
    const installRes = await fetch(`${PINATA_API}/clawhub/${hubSkillId}/install`, {
      method: "POST",
      headers: pinataHeaders(),
    });

    if (!installRes.ok) {
      const err = await installRes.text();
      // 409 = already installed — not an error
      if (installRes.status !== 409) throw new Error(`Skill install failed: ${err}`);
    }

    const installData = (await installRes.json()) as { skill: { skillCid: string } };
    const skillCid = installData.skill?.skillCid;
    if (!skillCid) throw new Error("No skillCid returned from install");

    // Step C: attach to the agent
    const attachRes = await fetch(`${PINATA_API}/agents/${agentId}/skills`, {
      method: "POST",
      headers: pinataHeaders(),
      body: JSON.stringify({ skillCids: [skillCid] }),
    });

    if (!attachRes.ok) {
      throw new Error(`Skill attach failed: ${await attachRes.text()}`);
    }
  }

  /**
   * Attach a custom skill by IPFS CID directly to an agent.
   * Used for the WePay bill-pay skill pinned via scripts/pin-wepay-skill.ts.
   */
  static async attachSkillCid(agentId: string, skillCid: string): Promise<void> {
    const res = await fetch(`${PINATA_API}/agents/${agentId}/skills`, {
      method: "POST",
      headers: pinataHeaders(),
      body: JSON.stringify({ skillCids: [skillCid] }),
    });
    if (!res.ok) {
      throw new Error(`Skill attach failed for CID ${skillCid}: ${await res.text()}`);
    }
  }

  /**
   * Pin encrypted user data to IPFS.
   * Returns the CID which should be stored on the User record.
   */
  static async pinUserData(userId: string, key: string, data: unknown): Promise<string> {
    const cid = await pinUserData(userId, key, data);
    logger.info("Pinned user data", { userId, key, cid });
    return cid;
  }

  /**
   * Pin the Next.js static export directory to IPFS for frontend deployment.
   * Returns the CID to set as wepay.eth contenthash.
   */
  static async deployFrontend(buildDir: string): Promise<string> {
    const result = await pinata.upload.public.fileArray(
      await Promise.all(
        (await import("fs")).readdirSync(buildDir, { recursive: true, withFileTypes: true })
          .filter(f => f.isFile())
          .map(async f => {
            const filePath = `${f.parentPath ?? f.path}/${f.name}`;
            const buffer = (await import("fs")).readFileSync(filePath);
            return new File([buffer], filePath.replace(buildDir + "/", ""));
          })
      ),
      { metadata: { name: "wepay-frontend", keyvalues: { version: new Date().toISOString() } } }
    );
    logger.info("Frontend deployed to IPFS", { cid: result.cid });
    return result.cid;
  }
}
