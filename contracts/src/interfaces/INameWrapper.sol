// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title INameWrapper
/// @notice Minimal interface for the ENS NameWrapper contract
/// @dev Full interface: https://github.com/ensdomains/ens-contracts/blob/master/contracts/wrapper/INameWrapper.sol
interface INameWrapper {
    /// @notice Create or update a subnode record.
    /// @param parentNode  The namehash of the parent name (e.g. wepay.eth)
    /// @param label       The subdomain label (e.g. "alice")
    /// @param owner       The owner of the new subnode
    /// @param resolver    Address of the resolver for the subnode
    /// @param ttl         Time-to-live for the subnode
    /// @param fuses       Fuse bitmask — controls what the owner/parent can do
    /// @param expiry      Unix timestamp expiry for the subdomain
    /// @return node       The namehash of the new subnode
    function setSubnodeRecord(
        bytes32 parentNode,
        string calldata label,
        address owner,
        address resolver,
        uint64 ttl,
        uint32 fuses,
        uint64 expiry
    ) external returns (bytes32 node);

    /// @notice Returns the owner, fuse state, and expiry of a wrapped name.
    /// @param id  The uint256 cast of the namehash
    function getData(uint256 id)
        external
        view
        returns (address owner, uint32 fuses, uint64 expiry);

    /// @notice Returns the owner of a wrapped name (ERC-1155 token owner).
    ///         REVERTS for non-existent tokens — always wrap in try/catch.
    function ownerOf(uint256 id) external view returns (address);

    /// @notice Check if an operator is approved to act on behalf of an owner.
    function isApprovedForAll(address owner, address operator) external view returns (bool);

    /// @notice Approve or revoke an operator on behalf of msg.sender.
    function setApprovalForAll(address operator, bool approved) external;
}
