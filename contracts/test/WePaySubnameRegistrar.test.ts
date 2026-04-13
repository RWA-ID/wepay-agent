import { expect } from "chai";
import { ethers } from "hardhat";
import type { WePaySubnameRegistrar } from "../typechain-types";

describe("WePaySubnameRegistrar", function () {
  let registrar: WePaySubnameRegistrar;
  let alice: any;
  let bob: any;
  const owsVaultAddress = "0x0000000000000000000000000000000000000A75";

  beforeEach(async function () {
    [, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("WePaySubnameRegistrar");
    registrar = (await Factory.deploy()) as WePaySubnameRegistrar;
    await registrar.waitForDeployment();
  });

  describe("Constants", function () {
    it("SUBDOMAIN_FUSES equals 327681", async function () {
      expect(await registrar.SUBDOMAIN_FUSES()).to.equal(327681);
    });

    it("WEPAY_NODE matches cast namehash wepay.eth", async function () {
      expect(await registrar.WEPAY_NODE()).to.equal(
        "0x783b76a8de513b3731a5998d7770987e5ff5aaa322aee1871ad6b16b0a561861"
      );
    });
  });

  describe("isAvailable()", function () {
    it("returns true for a valid unclaimed handle", async function () {
      expect(await registrar.isAvailable("alice")).to.be.true;
    });

    it("returns false for handles shorter than 3 chars", async function () {
      expect(await registrar.isAvailable("ab")).to.be.false;
    });

    it("returns false for handles longer than 32 chars", async function () {
      expect(await registrar.isAvailable("abcdefghijklmnopqrstuvwxyz1234567")).to.be.false;
    });

    it("returns true for handle with hyphen", async function () {
      expect(await registrar.isAvailable("ali-ce")).to.be.true;
    });

    it("returns false for handle with uppercase", async function () {
      expect(await registrar.isAvailable("Alice")).to.be.false;
    });

    it("returns false for handle with special characters", async function () {
      expect(await registrar.isAvailable("ali!ce")).to.be.false;
    });
  });

  describe("claimSubdomain() — validation (no ENS setup required)", function () {
    it("reverts with HandleTooShort for 2-char handle", async function () {
      await expect(
        registrar.connect(alice).claimSubdomain("ab", owsVaultAddress)
      ).to.be.revertedWithCustomError(registrar, "HandleTooShort");
    });

    it("reverts with HandleTooLong for 33-char handle", async function () {
      await expect(
        registrar.connect(alice).claimSubdomain("abcdefghijklmnopqrstuvwxyz1234567", owsVaultAddress)
      ).to.be.revertedWithCustomError(registrar, "HandleTooLong");
    });

    it("reverts with HandleInvalidCharacter for uppercase", async function () {
      await expect(
        registrar.connect(alice).claimSubdomain("Alice", owsVaultAddress)
      ).to.be.revertedWithCustomError(registrar, "HandleInvalidCharacter");
    });

    it("reverts with HandleInvalidCharacter for special chars", async function () {
      await expect(
        registrar.connect(alice).claimSubdomain("ali!ce", owsVaultAddress)
      ).to.be.revertedWithCustomError(registrar, "HandleInvalidCharacter");
    });

    // Note: full claimSubdomain integration tests require mainnet fork.
    // Run: forge test --fork-url $ETH_RPC_URL
  });

  describe("updateOWSAddress()", function () {
    it("reverts with NotSubnameOwner if caller is not the claimer", async function () {
      // Fake the state (labelHashToOwner mapping would be set on real claim)
      // This test verifies the guard logic directly
      await expect(
        registrar.connect(bob).updateOWSAddress("alice", owsVaultAddress)
      ).to.be.revertedWithCustomError(registrar, "NotSubnameOwner");
    });
  });
});
