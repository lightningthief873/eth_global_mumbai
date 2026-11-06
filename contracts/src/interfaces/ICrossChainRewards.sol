// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title ICrossChainRewards
/// @notice Interface stub for bridging PWSR rewards to other chains.
/// @dev Not implemented in MVP. Reserved for a future cross-chain reward bridge.
interface ICrossChainRewards {
    /// @notice Bridge `amount` of PWSR earned by `user` to a destination chain.
    function bridge(address user, uint256 amount) external;
}
