// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {PaymentHub} from "../src/PaymentHub.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/// Mock USDT: 6 decimals, EIP-2612 permit (mirrors the Whitechain test USDT).
contract MockUSDT is ERC20, ERC20Permit {
    constructor() ERC20("Tether USD", "USDT") ERC20Permit("Tether USD") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract PaymentHubTest is Test {
    MockUSDT usdt;
    PaymentHub hub;

    uint256 payerPk = 0xA11CE;
    address payer;
    address merchant = makeAddr("merchant");

    bytes32 constant INV = keccak256("invoice-1");

    function setUp() public {
        payer = vm.addr(payerPk);
        usdt = new MockUSDT();
        hub = new PaymentHub(address(usdt));
        usdt.mint(payer, 1_000e6);
        usdt.mint(merchant, 1_000e6);
    }

    // ---- pay (approve + transferFrom) ----

    function test_PayTransfersUsdtAndRecordsInvoice() public {
        vm.prank(payer);
        usdt.approve(address(hub), 100e6);

        vm.prank(payer);
        hub.pay(INV, merchant, 100e6);

        assertEq(usdt.balanceOf(merchant), 1_100e6);
        assertTrue(hub.isPaid(INV));
        PaymentHub.Invoice memory inv = hub.getInvoice(INV);
        assertEq(inv.payer, payer);
        assertEq(inv.amount, 100e6);
    }

    function test_DoublePayReverts() public {
        vm.startPrank(payer);
        usdt.approve(address(hub), 200e6);
        hub.pay(INV, merchant, 100e6);
        vm.expectRevert(bytes("already paid"));
        hub.pay(INV, merchant, 100e6);
        vm.stopPrank();
    }

    function test_ZeroAmountReverts() public {
        vm.prank(payer);
        vm.expectRevert(bytes("zero amount"));
        hub.pay(INV, merchant, 0);
    }

    // ---- payWithPermit (gasless approve, relayer-submitted) ----

    function test_PayWithPermitSettlesFromRelayer() public {
        uint256 amount = 50e6;
        uint256 deadline = block.timestamp + 1 hours;
        (uint8 v, bytes32 r, bytes32 s) = _permit(payerPk, address(hub), amount, deadline);

        address relayer = makeAddr("relayer");
        vm.prank(relayer); // relayer submits + pays gas; payer only signed off-chain
        hub.payWithPermit(INV, payer, merchant, amount, deadline, v, r, s);

        assertEq(usdt.balanceOf(merchant), 1_050e6);
        assertTrue(hub.isPaid(INV));
    }

    // ---- refund (full + partial) ----

    function test_PartialThenFullRefund() public {
        vm.prank(payer);
        usdt.approve(address(hub), 100e6);
        vm.prank(payer);
        hub.pay(INV, merchant, 100e6);

        vm.prank(merchant);
        usdt.approve(address(hub), 100e6);

        vm.prank(merchant);
        hub.refund(INV, 30e6);
        assertEq(hub.refundable(INV), 70e6);
        assertEq(usdt.balanceOf(payer), 930e6); // 1000 -100 +30

        vm.prank(merchant);
        hub.refund(INV, 70e6);
        assertEq(hub.refundable(INV), 0);
        assertEq(usdt.balanceOf(payer), 1_000e6);
    }

    function test_RefundOnlyMerchant() public {
        vm.prank(payer);
        usdt.approve(address(hub), 100e6);
        vm.prank(payer);
        hub.pay(INV, merchant, 100e6);

        vm.prank(payer);
        vm.expectRevert(bytes("only merchant"));
        hub.refund(INV, 10e6);
    }

    function test_OverRefundReverts() public {
        vm.prank(payer);
        usdt.approve(address(hub), 100e6);
        vm.prank(payer);
        hub.pay(INV, merchant, 100e6);

        vm.prank(merchant);
        usdt.approve(address(hub), 200e6);
        vm.prank(merchant);
        vm.expectRevert(bytes("bad amount"));
        hub.refund(INV, 101e6);
    }

    // ---- helpers ----

    function _permit(uint256 ownerPk, address spender, uint256 value, uint256 deadline)
        internal
        view
        returns (uint8 v, bytes32 r, bytes32 s)
    {
        address owner = vm.addr(ownerPk);
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                owner,
                spender,
                value,
                usdt.nonces(owner),
                deadline
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", usdt.DOMAIN_SEPARATOR(), structHash));
        (v, r, s) = vm.sign(ownerPk, digest);
    }
}
