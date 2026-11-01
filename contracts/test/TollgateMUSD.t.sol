// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "forge-std/Test.sol";
import "../src/TollgateMUSD.sol";

contract MockMUSD {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    function mint(address to, uint256 a) external { balanceOf[to] += a; }
    function approve(address s, uint256 a) external returns (bool) { allowance[msg.sender][s] = a; return true; }
    function transfer(address to, uint256 a) external returns (bool) { balanceOf[msg.sender] -= a; balanceOf[to] += a; return true; }
    function transferFrom(address f, address to, uint256 a) external returns (bool) {
        allowance[f][msg.sender] -= a; balanceOf[f] -= a; balanceOf[to] += a; return true;
    }
}

contract TollgateMUSDTest is Test {
    MockMUSD musd; TollgateMUSD tg;
    address builder = address(0xB0B); address agent = address(0xA9E); address treasury = address(0xFEE);

    function setUp() public {
        musd = new MockMUSD();
        tg = new TollgateMUSD(address(musd), treasury, 100); // 1%
        musd.mint(agent, 100 ether);
        vm.prank(agent); musd.approve(address(tg), type(uint256).max);
    }

    function testPayFlow() public {
        vm.prank(builder);
        uint256 id = tg.createToll(address(0), 0.01 ether, keccak256("https://api.example.com"));
        bytes32 req = keccak256("req-1");
        vm.prank(agent); tg.payCall(id, req, 0.01 ether);
        assertTrue(tg.isPaid(req, id));
        assertEq(musd.balanceOf(builder), 0.0099 ether);
        assertEq(musd.balanceOf(treasury), 0.0001 ether);
        (, , , , , uint64 calls, uint256 revenue) = tg.tolls(id);
        assertEq(calls, 1); assertEq(revenue, 0.0099 ether);
    }

    function testNoReplay() public {
        vm.prank(builder); uint256 id = tg.createToll(builder, 1 ether, 0);
        vm.startPrank(agent);
        tg.payCall(id, bytes32("x"), 1 ether);
        vm.expectRevert(TollgateMUSD.AlreadyPaid.selector);
        tg.payCall(id, bytes32("x"), 1 ether);
    }

    function testMaxPriceGuard() public {
        vm.prank(builder); uint256 id = tg.createToll(builder, 1 ether, 0);
        vm.prank(builder); tg.updateToll(id, builder, 2 ether, true);
        vm.prank(agent); vm.expectRevert(TollgateMUSD.MaxPriceExceeded.selector);
        tg.payCall(id, bytes32("y"), 1 ether);
    }

    function testOnlyOwnerUpdates() public {
        vm.prank(builder); uint256 id = tg.createToll(builder, 1 ether, 0);
        vm.prank(agent); vm.expectRevert(TollgateMUSD.NotOwner.selector);
        tg.updateToll(id, agent, 1, true);
    }
}
