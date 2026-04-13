// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title IPublicResolver
/// @notice Minimal interface for the ENS Public Resolver
/// @dev Full interface: https://github.com/ensdomains/ens-contracts/blob/master/contracts/resolvers/PublicResolver.sol
interface IPublicResolver {
    /// @notice Set the ETH address record for a node (coin type 60)
    function setAddr(bytes32 node, address addr) external;

    /// @notice Set a multi-coin address record for a node (ENSIP-9)
    /// @param  coinType  SLIP-44 coin type — e.g. 60 = ETH, 501 = Solana
    /// @param  a         Raw address bytes for the given chain
    function setAddr(bytes32 node, uint256 coinType, bytes calldata a) external;

    /// @notice Set a text record for a node (key-value pair)
    function setText(bytes32 node, string calldata key, string calldata value) external;

    /// @notice Batch multiple resolver calls in one transaction
    function multicall(bytes[] calldata data) external returns (bytes[] memory results);
}
