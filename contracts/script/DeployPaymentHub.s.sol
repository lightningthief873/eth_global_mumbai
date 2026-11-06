// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {PaymentHub} from "../src/PaymentHub.sol";

/// Deploys PaymentHub bound to the official Whitechain Sepolia USDT token.
contract DeployPaymentHub is Script {
    address constant USDT = 0xcedfB56113143d55b2358b8CFbB0dEB5Ad2f55a7;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        PaymentHub hub = new PaymentHub(USDT);
        vm.stopBroadcast();
        console.log("PAYMENT_HUB_ADDRESS=%s", address(hub));
    }
}
