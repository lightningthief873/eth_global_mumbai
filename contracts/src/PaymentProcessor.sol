// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPWSRMintable is IERC20 {
    function mint(address to, uint256 amount) external;
}

/// @title PaymentProcessor
/// @notice Receives native WBT, forwards it to the merchant, and mints PWSR rewards.
/// @dev `charge` is payable and sent by the customer's custodial wallet (msg.sender).
///      The reward is minted to msg.sender. No relayer-only gate — any enrolled
///      customer wallet may pay. Reward rate is admin-settable.
contract PaymentProcessor is AccessControl, ReentrancyGuard {
    IPWSRMintable public pwsr;

    /// @notice PWSR minted per 1 WBT paid, scaled by 1e18 (e.g. 100e18 = 100 PWSR / WBT).
    uint256 public rewardRate;

    /// @notice Optional cross-chain reward sink (unused in MVP).
    address public crossChainRewards;

    event Paid(
        address indexed customer,
        address indexed merchant,
        uint256 amount,
        uint256 reward,
        uint256 timestamp
    );
    event RewardRateUpdated(uint256 rewardRate);
    event TokenUpdated(address token);

    constructor(address pwsrToken, uint256 initialRewardRate) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        pwsr = IPWSRMintable(pwsrToken);
        rewardRate = initialRewardRate;
    }

    /// @notice Pay `merchant` with the attached WBT and mint PWSR to the payer.
    function charge(address payable merchant) external payable nonReentrant {
        require(msg.value > 0, "zero value");
        require(merchant != address(0), "bad merchant");

        (bool ok, ) = merchant.call{value: msg.value}("");
        require(ok, "WBT transfer failed");

        uint256 reward = (msg.value * rewardRate) / 1e18;
        if (reward > 0) {
            pwsr.mint(msg.sender, reward);
        }

        emit Paid(msg.sender, merchant, msg.value, reward, block.timestamp);
    }

    function setRewardRate(uint256 newRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        rewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }

    function setToken(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        pwsr = IPWSRMintable(token);
        emit TokenUpdated(token);
    }

    function setCrossChainRewards(address sink) external onlyRole(DEFAULT_ADMIN_ROLE) {
        crossChainRewards = sink;
    }
}
