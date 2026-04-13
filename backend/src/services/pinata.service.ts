import { pinata } from "../utils/ipfs.js";
import { db } from "../db.js";
import { logger } from "../utils/logger.js";
import { pinUserData } from "../utils/ipfs.js";

const PINATA_API = "https://agents.pinata.cloud/v0";
// ClawHub slug for the lobstercash skill (crossmint/lobstercash)
const LOBSTER_HUB_SLUG = "crossmint/lobstercash";

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

    // 2. Install lobstercash skill (non-fatal — agent still works without it,
    //    fiat payments will just fail until manually installed)
    try {
      await PinataAgentService.installLobsterSkill(agentId);
      logger.info("Lobstercash skill installed", { userId, agentId });
    } catch (err) {
      logger.warn("Lobstercash skill installation failed — continuing without it", { userId, agentId, err });
    }

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
    const result = await pinata.upload.public.directory(buildDir, {
      metadata: {
        name: "wepay-frontend",
        keyvalues: { version: new Date().toISOString() },
      },
    });
    logger.info("Frontend deployed to IPFS", { cid: result.cid });
    return result.cid;
  }
}
