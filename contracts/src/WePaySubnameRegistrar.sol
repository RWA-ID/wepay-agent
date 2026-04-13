// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "./interfaces/INameWrapper.sol";
import "./interfaces/IPublicResolver.sol";

// ── Custom Errors ──────────────────────────────────────────────────────────────
error HandleAlreadyClaimed(string handle);
error HandleTooShort();
error HandleTooLong();
error HandleInvalidCharacter(bytes1 char);
error NotSubnameOwner();
error ParentNotLocked();

/// @title WePaySubnameRegistrar
/// @notice Issues permanent, emancipated {handle}.wepay.eth subdomains via ENS NameWrapper.
///
/// @dev PREREQUISITE: wepay.eth MUST be wrapped AND locked (CANNOT_UNWRAP burned) in
///      the NameWrapper BEFORE this contract is deployed, AND this contract must be
///      approved as an operator via nameWrapper.setApprovalForAll(address(this), true).
///
///      Fuses burned on each subdomain (value 327681):
///        CANNOT_UNWRAP           (1)       — subdomain stays in Locked state
///        PARENT_CANNOT_CONTROL   (65536)   — WePay can NEVER reclaim or replace this name
///        CAN_EXTEND_EXPIRY       (262144)  — owner can extend their own expiry independently
///
///      This makes each subdomain a permanent ERC-1155 NFT that WePay cannot revoke.
contract WePaySubnameRegistrar is Ownable, ReentrancyGuard, ERC1155Holder {

    // ── ENS Mainnet Contract Addresses ────────────────────────────────────────
    INameWrapper public constant NAME_WRAPPER =
        INameWrapper(0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401);

    IPublicResolver public constant PUBLIC_RESOLVER =
        IPublicResolver(0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63);

    // ── wepay.eth constants ───────────────────────────────────────────────────
    /// @dev namehash("wepay.eth") — verified with: cast namehash wepay.eth
    bytes32 public constant WEPAY_NODE =
        0x783b76a8de513b3731a5998d7770987e5ff5aaa322aee1871ad6b16b0a561861;

    /// @dev Fuse bitmask: CANNOT_UNWRAP | PARENT_CANNOT_CONTROL | CAN_EXTEND_EXPIRY
    ///      = 1 | 65536 | 262144 = 327681
    ///      With these three fuses burned the subdomain is a permanent "forever name".
    uint32 public constant SUBDOMAIN_FUSES = 327681;

    // ── State ─────────────────────────────────────────────────────────────────
    /// @notice Maps labelhash → original claimer address
    mapping(bytes32 => address) public labelHashToOwner;

    /// @notice Maps claimer address → their handle string
    mapping(address => string) public addressToHandle;

    /// @notice Whether a given handle string has been claimed
    mapping(string => bool) public handleClaimed;

    // ── Events ────────────────────────────────────────────────────────────────
    event SubdomainClaimed(
        string  indexed handle,
        bytes32 indexed labelHash,
        bytes32 indexed subnodeHash,
        address         claimer,
        address         owsVaultAddress,
        uint64          expiry
    );

    event OWSAddressUpdated(
        bytes32 indexed subnodeHash,
        address indexed claimer,
        address         newOWSAddress
    );

    constructor() Ownable(msg.sender) {}

    // ── External Functions ────────────────────────────────────────────────────

    /// @notice Claim a permanent {handle}.wepay.eth subdomain.
    /// @dev    Gas is paid by the caller. For gas sponsorship, deploy an
    ///         EIP-2771 trusted forwarder and route calls through it.
    ///         The caller must have an active WePay subscription (enforced off-chain
    ///         via the meta-tx relayer; on-chain there is no payment gate).
    /// @param  handle             Desired label, e.g. "alice" → alice.wepay.eth
    /// @param  owsVaultAddress    The user's OWS vault address — set as ETH addr record (coin type 60)
    /// @param  solanaCardAddress  The user's Lobster.cash Solana wallet — set as Solana addr record
    ///                            (coin type 501, ENSIP-9). Pass empty bytes to skip.
    ///                            Allows funding the Lobster virtual card by sending USDC on Solana
    ///                            directly to handle.wepay.eth.
    function claimSubdomain(
        string calldata handle,
        address owsVaultAddress,
        bytes calldata solanaCardAddress
    ) external nonReentrant {
        _validateHandle(handle);

        if (handleClaimed[handle]) revert HandleAlreadyClaimed(handle);

        // ── Compute node hashes ───────────────────────────────────────────────
        bytes32 labelHash   = keccak256(bytes(handle));
        bytes32 subnodeHash = keccak256(abi.encodePacked(WEPAY_NODE, labelHash));

        // ── Get parent expiry so subdomain expiry matches ─────────────────────
        (, , uint64 parentExpiry) = NAME_WRAPPER.getData(uint256(WEPAY_NODE));

        // ── Mark claimed BEFORE external calls (CEI pattern) ─────────────────
        handleClaimed[handle]            = true;
        labelHashToOwner[labelHash]      = msg.sender;
        addressToHandle[msg.sender]      = handle;

        // ── Step 1: Create subdomain with THIS contract as temporary owner ────
        //    We own it temporarily so we can set resolver records before
        //    handing off to the user and burning fuses.
        NAME_WRAPPER.setSubnodeRecord(
            WEPAY_NODE,
            handle,
            address(this),          // temporary owner
            address(PUBLIC_RESOLVER),
            0,                      // TTL
            0,                      // no fuses yet — set after resolver records
            parentExpiry            // expiry = parent expiry
        );

        // ── Step 2: Set resolver records (addr + text) in one multicall ───────
        // Solana coin type = 501 (SLIP-44) per ENSIP-9
        bool hasSolana = solanaCardAddress.length > 0;
        bytes[] memory calls = new bytes[](hasSolana ? 4 : 3);

        // EVM address (coin type 60) — funds the OWS vault on Base
        calls[0] = abi.encodeWithSignature(
            "setAddr(bytes32,address)",
            subnodeHash,
            owsVaultAddress
        );
        calls[1] = abi.encodeWithSignature(
            "setText(bytes32,string,string)",
            subnodeHash,
            "ows-vault",
            _toHexString(owsVaultAddress)
        );
        calls[2] = abi.encodeWithSignature(
            "setText(bytes32,string,string)",
            subnodeHash,
            "url",
            string.concat("https://wepay.eth.limo/u/", handle)
        );
        // Solana address (coin type 501) — funds the Lobster.cash virtual card
        if (hasSolana) {
            calls[3] = abi.encodeWithSignature(
                "setAddr(bytes32,uint256,bytes)",
                subnodeHash,
                uint256(501),
                solanaCardAddress
            );
        }

        PUBLIC_RESOLVER.multicall(calls);

        // ── Step 3: Transfer to final owner WITH fuses burned ─────────────────
        // Once PARENT_CANNOT_CONTROL is burned here, we can never reclaim it.
        NAME_WRAPPER.setSubnodeRecord(
            WEPAY_NODE,
            handle,
            msg.sender,             // final owner: the user
            address(PUBLIC_RESOLVER),
            0,
            SUBDOMAIN_FUSES,        // burn: CANNOT_UNWRAP | PARENT_CANNOT_CONTROL | CAN_EXTEND_EXPIRY
            parentExpiry
        );

        emit SubdomainClaimed(handle, labelHash, subnodeHash, msg.sender, owsVaultAddress, parentExpiry);
    }

    /// @notice Update the Lobster.cash Solana card address on an existing subdomain.
    /// @param  handle           The user's handle (must match msg.sender)
    /// @param  newSolanaAddress New Solana wallet bytes (32-byte pubkey, raw)
    function updateSolanaAddress(string calldata handle, bytes calldata newSolanaAddress) external {
        bytes32 labelHash = keccak256(bytes(handle));
        if (labelHashToOwner[labelHash] != msg.sender) revert NotSubnameOwner();

        bytes32 subnodeHash = keccak256(abi.encodePacked(WEPAY_NODE, labelHash));
        PUBLIC_RESOLVER.setAddr(subnodeHash, 501, newSolanaAddress);
    }

    /// @notice Update the OWS vault address on an existing subdomain.
    /// @dev    Only callable by the original claimer. Users can also update
    ///         records directly via ENS Manager since they own the ERC-1155 NFT.
    ///         CANNOT_SET_RESOLVER was intentionally NOT burned, giving users flexibility.
    /// @param  handle         The user's handle (must match msg.sender)
    /// @param  newOWSAddress  New OWS vault address
    function updateOWSAddress(string calldata handle, address newOWSAddress) external {
        bytes32 labelHash = keccak256(bytes(handle));
        if (labelHashToOwner[labelHash] != msg.sender) revert NotSubnameOwner();

        bytes32 subnodeHash = keccak256(abi.encodePacked(WEPAY_NODE, labelHash));

        PUBLIC_RESOLVER.setAddr(subnodeHash, newOWSAddress);
        PUBLIC_RESOLVER.setText(subnodeHash, "ows-vault", _toHexString(newOWSAddress));

        emit OWSAddressUpdated(subnodeHash, msg.sender, newOWSAddress);
    }

    /// @notice Check if a handle is available (valid + unclaimed).
    function isAvailable(string calldata handle) external view returns (bool) {
        if (!_isValidHandle(handle)) return false;
        return !handleClaimed[handle];
    }

    // ── Owner Functions ───────────────────────────────────────────────────────

    /// @notice Verify wepay.eth is properly wrapped and locked.
    ///         Call this after deployment to confirm setup is correct before any claims.
    /// @return locked  True if CANNOT_UNWRAP fuse is burned on wepay.eth
    /// @return expiry  Unix timestamp of wepay.eth expiry
    function verifyParentLocked() external view returns (bool locked, uint64 expiry) {
        (, uint32 fuses, uint64 exp) = NAME_WRAPPER.getData(uint256(WEPAY_NODE));
        // CANNOT_UNWRAP = 1. Must be burned before subdomain fuses are enforceable.
        locked = (fuses & 1) != 0;
        expiry = exp;
    }

    // ── Internal Helpers ──────────────────────────────────────────────────────

    function _validateHandle(string calldata handle) internal pure {
        if (!_isValidHandle(handle)) {
            bytes memory b = bytes(handle);
            if (b.length < 3) revert HandleTooShort();
            if (b.length > 32) revert HandleTooLong();
            for (uint256 i = 0; i < b.length; i++) {
                bytes1 c = b[i];
                bool ok = (c >= 0x61 && c <= 0x7A) || (c >= 0x30 && c <= 0x39) || c == 0x2D;
                if (!ok) revert HandleInvalidCharacter(c);
            }
        }
    }

    function _isValidHandle(string calldata handle) internal pure returns (bool) {
        bytes memory b = bytes(handle);
        if (b.length < 3 || b.length > 32) return false;
        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            bool ok = (c >= 0x61 && c <= 0x7A) || (c >= 0x30 && c <= 0x39) || c == 0x2D;
            if (!ok) return false;
        }
        return true;
    }

    /// @dev Converts an address to its checksummed hex string representation (e.g. "0xAbCd...").
    function _toHexString(address addr) internal pure returns (string memory) {
        bytes memory buffer = new bytes(42);
        buffer[0] = "0";
        buffer[1] = "x";
        bytes16 chars = "0123456789abcdef";
        for (uint256 i = 0; i < 20; i++) {
            buffer[2 + i * 2]     = chars[uint8(bytes20(addr)[i]) >> 4];
            buffer[3 + i * 2]     = chars[uint8(bytes20(addr)[i]) & 0x0f];
        }
        return string(buffer);
    }

    // Required to receive ERC-1155 tokens during the two-step subdomain claim.
    // ERC1155Holder from OpenZeppelin implements onERC1155Received / onERC1155BatchReceived.
}
