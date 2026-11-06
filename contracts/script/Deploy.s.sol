// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {PWSRToken} from "../src/PWSRToken.sol";
import {BiometricRegistry} from "../src/BiometricRegistry.sol";
import {PaymentProcessor} from "../src/PaymentProcessor.sol";

/// @notice Deploys PWSRToken, PaymentProcessor, BiometricRegistry and wires roles.
/// The deployer (broadcast key) is also the relayer/verifier.
contract Deploy is Script {
    // 100 PWSR per 1 WBT
    uint256 constant REWARD_RATE = 100e18;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        PWSRToken token = new PWSRToken();
        PaymentProcessor processor = new PaymentProcessor(address(token), REWARD_RATE);
        BiometricRegistry registry = new BiometricRegistry(deployer);

        // Allow the processor to mint reward tokens.
        token.grantRole(token.MINTER_ROLE(), address(processor));

        vm.stopBroadcast();

        console.log("PWSR_TOKEN_ADDRESS=%s", address(token));
        console.log("PAYMENT_PROCESSOR_ADDRESS=%s", address(processor));
        console.log("BIOMETRIC_REGISTRY_ADDRESS=%s", address(registry));
    }
}
