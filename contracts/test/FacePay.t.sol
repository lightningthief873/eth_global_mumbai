// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {PWSRToken} from "../src/PWSRToken.sol";
import {BiometricRegistry} from "../src/BiometricRegistry.sol";
import {PaymentProcessor} from "../src/PaymentProcessor.sol";

contract FacePayTest is Test {
    PWSRToken token;
    BiometricRegistry registry;
    PaymentProcessor processor;

    address relayer = makeAddr("relayer");
    address customer = makeAddr("customer");
    address merchant = makeAddr("merchant");

    uint256 constant RATE = 100e18; // 100 PWSR per WBT

    function setUp() public {
        token = new PWSRToken();
        processor = new PaymentProcessor(address(token), RATE);
        registry = new BiometricRegistry(relayer);
        token.grantRole(token.MINTER_ROLE(), address(processor));
    }

    // ---- PWSRToken ----

    function test_OnlyMinterCanMint() public {
        vm.prank(address(processor));
        token.mint(customer, 5e18);
        assertEq(token.balanceOf(customer), 5e18);
    }

    function test_NonMinterMintReverts() public {
        vm.expectRevert();
        vm.prank(customer);
        token.mint(customer, 1e18);
    }

    // ---- PaymentProcessor ----

    function test_ChargeForwardsWbtAndMintsReward() public {
        vm.deal(customer, 1 ether);
        uint256 merchantBefore = merchant.balance;

        vm.prank(customer);
        processor.charge{value: 0.01 ether}(payable(merchant));

        assertEq(merchant.balance, merchantBefore + 0.01 ether);
        // reward = 0.01 * 100 = 1 PWSR
        assertEq(token.balanceOf(customer), 1e18);
    }

    function test_ChargeZeroValueReverts() public {
        vm.prank(customer);
        vm.expectRevert(bytes("zero value"));
        processor.charge{value: 0}(payable(merchant));
    }

    function test_ChargeBadMerchantReverts() public {
        vm.deal(customer, 1 ether);
        vm.prank(customer);
        vm.expectRevert(bytes("bad merchant"));
        processor.charge{value: 0.01 ether}(payable(address(0)));
    }

    function test_SetRewardRateChangesReward() public {
        processor.setRewardRate(50e18);
        vm.deal(customer, 1 ether);
        vm.prank(customer);
        processor.charge{value: 0.01 ether}(payable(merchant));
        assertEq(token.balanceOf(customer), 0.5e18);
    }

    // ---- BiometricRegistry ----

    function test_EnrollSetsActiveRecord() public {
        vm.prank(relayer);
        registry.enroll(customer, bytes32(uint256(0xABC)));
        assertTrue(registry.isEnrolled(customer));
    }

    function test_NonVerifierEnrollReverts() public {
        vm.expectRevert();
        vm.prank(customer);
        registry.enroll(customer, bytes32(uint256(1)));
    }

    function test_NonceIncrementsAndConsumes() public {
        vm.startPrank(relayer);
        registry.enroll(customer, bytes32(uint256(1)));
        uint256 n1 = registry.issueNonce(customer);
        assertEq(n1, 1);
        registry.consumeNonce(customer, n1);
        uint256 n2 = registry.issueNonce(customer);
        assertEq(n2, 2);
        vm.stopPrank();
    }

    function test_StaleNonceReverts() public {
        vm.startPrank(relayer);
        registry.enroll(customer, bytes32(uint256(1)));
        registry.issueNonce(customer);
        vm.expectRevert(bytes("stale nonce"));
        registry.consumeNonce(customer, 99);
        vm.stopPrank();
    }

    function test_ExpiredNonceReverts() public {
        vm.startPrank(relayer);
        registry.enroll(customer, bytes32(uint256(1)));
        uint256 n = registry.issueNonce(customer);
        vm.warp(block.timestamp + 3601);
        vm.expectRevert(bytes("nonce expired"));
        registry.consumeNonce(customer, n);
        vm.stopPrank();
    }

    function test_RevokeDeactivates() public {
        vm.startPrank(relayer);
        registry.enroll(customer, bytes32(uint256(1)));
        registry.revoke(customer);
        vm.stopPrank();
        assertFalse(registry.isEnrolled(customer));
    }
}
