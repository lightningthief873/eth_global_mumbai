// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title PaymentHub
/// @notice Invoice-aware USDT settlement for merchants on Whitechain.
/// @dev Not a plain transfer: every payment is bound to a merchant-issued invoice id,
///      recorded on-chain, and refundable (full or partial) by the merchant. Events are
///      the customer-verifiable receipt. Settlement is in a single fixed USDT token.
contract PaymentHub is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdt;

    struct Invoice {
        address payer;
        address merchant;
        uint256 amount;    // total paid, in USDT base units (6 decimals)
        uint256 refunded;  // cumulative refunded
        uint64 paidAt;
        bool paid;
    }

    mapping(bytes32 => Invoice) private _invoices;

    event InvoicePaid(
        bytes32 indexed invoiceId,
        address indexed payer,
        address indexed merchant,
        uint256 amount,
        uint256 timestamp
    );
    event InvoiceRefunded(
        bytes32 indexed invoiceId,
        address indexed merchant,
        address indexed payer,
        uint256 amount,
        uint256 totalRefunded,
        uint256 timestamp
    );

    constructor(address usdtToken) {
        require(usdtToken != address(0), "bad token");
        usdt = IERC20(usdtToken);
    }

    /// @notice Pay an invoice. Caller must have approved this hub for `amount` USDT.
    function pay(bytes32 invoiceId, address merchant, uint256 amount) external nonReentrant {
        _settle(invoiceId, msg.sender, merchant, amount);
    }

    /// @notice Pay an invoice using an EIP-2612 permit, so the payer signs off-chain and
    ///         a relayer can submit the transaction and cover gas. `payer` is the signer.
    function payWithPermit(
        bytes32 invoiceId,
        address payer,
        address merchant,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant {
        // Grant allowance from payer -> this hub. Tolerate a already-set allowance.
        try IERC20Permit(address(usdt)).permit(payer, address(this), amount, deadline, v, r, s) {} catch {}
        _settle(invoiceId, payer, merchant, amount);
    }

    /// @notice Refund part or all of a paid invoice back to the original payer.
    /// @dev Only the invoice's merchant may call. Merchant must approve this hub for the
    ///      refund amount in USDT.
    function refund(bytes32 invoiceId, uint256 amount) external nonReentrant {
        Invoice storage inv = _invoices[invoiceId];
        require(inv.paid, "not paid");
        require(msg.sender == inv.merchant, "only merchant");
        require(amount > 0 && inv.refunded + amount <= inv.amount, "bad amount");
        inv.refunded += amount;
        usdt.safeTransferFrom(inv.merchant, inv.payer, amount);
        emit InvoiceRefunded(invoiceId, inv.merchant, inv.payer, amount, inv.refunded, block.timestamp);
    }

    function _settle(bytes32 invoiceId, address payer, address merchant, uint256 amount) private {
        require(amount > 0, "zero amount");
        require(merchant != address(0), "bad merchant");
        Invoice storage inv = _invoices[invoiceId];
        require(!inv.paid, "already paid");

        inv.payer = payer;
        inv.merchant = merchant;
        inv.amount = amount;
        inv.paidAt = uint64(block.timestamp);
        inv.paid = true;

        usdt.safeTransferFrom(payer, merchant, amount);
        emit InvoicePaid(invoiceId, payer, merchant, amount, block.timestamp);
    }

    function getInvoice(bytes32 invoiceId) external view returns (Invoice memory) {
        return _invoices[invoiceId];
    }

    function isPaid(bytes32 invoiceId) external view returns (bool) {
        return _invoices[invoiceId].paid;
    }

    function refundable(bytes32 invoiceId) external view returns (uint256) {
        Invoice storage inv = _invoices[invoiceId];
        return inv.amount - inv.refunded;
    }
}
