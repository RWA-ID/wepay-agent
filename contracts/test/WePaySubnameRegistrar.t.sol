// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Test.sol";
import "../src/WePaySubnameRegistrar.sol";

/// @dev Fork mainnet to test against the real NameWrapper and ENS contracts.
///      Run with: forge test --fork-url $ETH_RPC_URL -vvv
contract WePaySubnameRegistrarTest is Test {
    WePaySubnameRegistrar registrar;

    address alice   = address(0xA11CE);
    address bob     = address(0xB0B);
    address owsVault = address(0x0A75);

    // ENS NameWrapper on mainnet
    INameWrapper constant NAME_WRAPPER =
        INameWrapper(0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401);

    function setUp() public {
        vm.createSelectFork(vm.envString("ETH_RPC_URL"));
        registrar = new WePaySubnameRegistrar();

        // TODO (before live tests):
        // 1. Impersonate the wepay.eth owner wallet and approve the registrar:
        //    vm.prank(WEPAY_OWNER);
        //    NAME_WRAPPER.setApprovalForAll(address(registrar), true);
        // 2. Confirm wepay.eth is wrapped and CANNOT_UNWRAP is burned.
        //    These require the actual owner to have completed ENS setup.
    }

    // ── Handle validation ────────────────────────────────────────────────────

    function test_RevertIfHandleTooShort() public {
        vm.prank(alice);
        vm.expectRevert(HandleTooShort.selector);
        registrar.claimSubdomain("ab", owsVault);
    }

    function test_RevertIfHandleTooLong() public {
        vm.prank(alice);
        vm.expectRevert(HandleTooLong.selector);
        // 33 chars
        registrar.claimSubdomain("abcdefghijklmnopqrstuvwxyz1234567", owsVault);
    }

    function test_RevertOnUppercase() public {
        vm.prank(alice);
        vm.expectRevert();
        registrar.claimSubdomain("Alice", owsVault);
    }

    function test_RevertOnSpecialChar() public {
        vm.prank(alice);
        vm.expectRevert();
        registrar.claimSubdomain("ali!ce", owsVault);
    }

    function test_ValidHandleWithHyphen() public view {
        assertTrue(registrar.isAvailable("ali-ce"));
    }

    function test_ValidHandleWithNumbers() public view {
        assertTrue(registrar.isAvailable("alice99"));
    }

    // ── isAvailable ──────────────────────────────────────────────────────────

    function test_IsAvailableReturnsTrueForUnclaimed() public view {
        assertTrue(registrar.isAvailable("alice"));
    }

    function test_IsAvailableReturnsFalseForTooShort() public view {
        assertFalse(registrar.isAvailable("ab"));
    }

    function test_IsAvailableReturnsFalseForTooLong() public view {
        assertFalse(registrar.isAvailable("abcdefghijklmnopqrstuvwxyz1234567"));
    }

    // ── Constants ────────────────────────────────────────────────────────────

    function test_FuseConstant() public pure {
        // CANNOT_UNWRAP | PARENT_CANNOT_CONTROL | CAN_EXTEND_EXPIRY
        // = 1 | 65536 | 262144 = 327681
        assertEq(WePaySubnameRegistrar.SUBDOMAIN_FUSES, 327681);
    }

    function test_WepayNodeConstant() public pure {
        // cast namehash wepay.eth
        assertEq(
            WePaySubnameRegistrar.WEPAY_NODE,
            0x783b76a8de513b3731a5998d7770987e5ff5aaa322aee1871ad6b16b0a561861
        );
    }

    // ── verifyParentLocked ───────────────────────────────────────────────────

    function test_VerifyParentLocked_ReturnsCorrectState() public view {
        (bool locked, uint64 expiry) = registrar.verifyParentLocked();
        // On fork: wepay.eth must be wrapped for this to return meaningful data.
        // If not yet wrapped, locked=false. Log the result for manual verification.
        emit log_named_string("wepay.eth locked", locked ? "YES" : "NO — must wrap + lock before launch");
        emit log_named_uint("wepay.eth expiry", expiry);
    }

    // ── Duplicate claim prevention ───────────────────────────────────────────

    // NOTE: Full claimSubdomain tests require wepay.eth to be wrapped + locked
    // and the registrar approved as NameWrapper operator.
    // Enable the tests below after completing ENS setup.

    // function test_CannotClaimSameHandleTwice() public {
    //     vm.prank(alice);
    //     registrar.claimSubdomain("alice", owsVault);
    //
    //     vm.prank(bob);
    //     vm.expectRevert(abi.encodeWithSelector(HandleAlreadyClaimed.selector, "alice"));
    //     registrar.claimSubdomain("alice", owsVault);
    // }

    // function test_ClaimSetsAddressToHandle() public {
    //     vm.prank(alice);
    //     registrar.claimSubdomain("alice", owsVault);
    //     assertEq(registrar.addressToHandle(alice), "alice");
    // }

    // function test_UpdateOWSAddressRevertsForNonOwner() public {
    //     vm.prank(alice);
    //     registrar.claimSubdomain("alice", owsVault);
    //
    //     vm.prank(bob);
    //     vm.expectRevert(NotSubnameOwner.selector);
    //     registrar.updateOWSAddress("alice", address(0x1234));
    // }
}
