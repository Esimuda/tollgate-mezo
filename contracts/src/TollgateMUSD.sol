// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title TollgateMUSD — pay-per-request tolls for AI agents, settled in MUSD on Mezo
/// @notice A builder registers a toll (price per call, payee). An agent pays a call with
///         `payCall`, which pulls MUSD from the agent straight to the builder (minus an
///         optional protocol fee) and records an on-chain receipt keyed by a unique requestId.
///         The Tollgate gateway checks `receipts[requestId]` before forwarding the API call.
contract TollgateMUSD {
    struct Toll {
        address owner;     // builder who controls the toll
        address payee;     // where MUSD revenue lands
        uint128 price;     // MUSD per call (18 decimals)
        bool active;
        bytes32 endpointHash; // keccak256 of upstream URL (URL itself stays off-chain)
        uint64 calls;
        uint256 revenue;
    }

    struct Receipt {
        uint256 tollId;
        address payer;
        uint128 amount;
        uint64 paidAt;
    }

    IERC20 public immutable musd;
    address public feeRecipient;
    uint16 public immutable feeBps; // max 500 = 5%
    uint256 public nextTollId = 1;

    mapping(uint256 => Toll) public tolls;
    mapping(bytes32 => Receipt) public receipts;

    event TollCreated(uint256 indexed tollId, address indexed owner, address payee, uint128 price, bytes32 endpointHash);
    event TollUpdated(uint256 indexed tollId, address payee, uint128 price, bool active);
    event CallPaid(uint256 indexed tollId, bytes32 indexed requestId, address indexed payer, uint128 amount, uint128 fee);

    error NotOwner();
    error TollInactive();
    error AlreadyPaid();
    error BadPrice();
    error MaxPriceExceeded();
    error TransferFailed();

    constructor(address musd_, address feeRecipient_, uint16 feeBps_) {
        require(musd_ != address(0) && feeBps_ <= 500, "bad config");
        musd = IERC20(musd_);
        feeRecipient = feeRecipient_;
        feeBps = feeBps_;
    }

    function createToll(address payee, uint128 price, bytes32 endpointHash) external returns (uint256 id) {
        if (price == 0) revert BadPrice();
        id = nextTollId++;
        tolls[id] = Toll(msg.sender, payee == address(0) ? msg.sender : payee, price, true, endpointHash, 0, 0);
        emit TollCreated(id, msg.sender, tolls[id].payee, price, endpointHash);
    }

    function updateToll(uint256 id, address payee, uint128 price, bool active) external {
        Toll storage t = tolls[id];
        if (t.owner != msg.sender) revert NotOwner();
        if (price == 0) revert BadPrice();
        t.payee = payee == address(0) ? msg.sender : payee;
        t.price = price;
        t.active = active;
        emit TollUpdated(id, t.payee, price, active);
    }

    /// @param requestId unique nonce issued by the gateway in the 402 challenge
    /// @param maxPrice  agent-side slippage guard against the builder raising the price
    function payCall(uint256 id, bytes32 requestId, uint128 maxPrice) external {
        Toll storage t = tolls[id];
        if (!t.active) revert TollInactive();
        if (receipts[requestId].payer != address(0)) revert AlreadyPaid();
        uint128 price = t.price;
        if (price > maxPrice) revert MaxPriceExceeded();

        uint128 fee = uint128((uint256(price) * feeBps) / 10_000);
        receipts[requestId] = Receipt(id, msg.sender, price, uint64(block.timestamp));
        unchecked { t.calls += 1; }
        t.revenue += price - fee;

        if (!musd.transferFrom(msg.sender, t.payee, price - fee)) revert TransferFailed();
        if (fee > 0 && !musd.transferFrom(msg.sender, feeRecipient, fee)) revert TransferFailed();
        emit CallPaid(id, requestId, msg.sender, price, fee);
    }

    function isPaid(bytes32 requestId, uint256 id) external view returns (bool) {
        Receipt memory r = receipts[requestId];
        return r.payer != address(0) && r.tollId == id;
    }
}
