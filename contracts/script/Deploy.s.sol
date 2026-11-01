// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "forge-std/Script.sol";
import "../src/TollgateMUSD.sol";

/// forge script script/Deploy.s.sol --rpc-url mezo_testnet --broadcast --private-key $DEPLOYER_KEY
contract Deploy is Script {
    address constant MUSD_TESTNET = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;
    function run() external {
        address treasury = vm.envOr("FEE_RECIPIENT", msg.sender);
        uint16 feeBps = uint16(vm.envOr("FEE_BPS", uint256(0)));
        vm.startBroadcast();
        TollgateMUSD tg = new TollgateMUSD(MUSD_TESTNET, treasury, feeBps);
        vm.stopBroadcast();
        console.log("TollgateMUSD:", address(tg));
    }
}
