pragma solidity ^0.4.23;

import "oraclize-api/usingOraclize.sol";

contract Roulette is usingOraclize {
    uint256 public token;
    address public owner;

    enum CashflowType {
        Inflow,
        Outflow
    }

    struct PlayerInfo {
        address player;
        uint256 betSize;
        uint8 betNumber;
    }

    // mapping(address=>uint256) investorBalances;
    mapping(bytes32=>PlayerInfo) players;

    event LogBet(address player, uint256 betSize, uint8 betNumber);
    event LogPlay(address player, uint256 betSize, uint8 betNumber, uint8 winningNumber);
    event LogPayout(address winner, uint256 payout);
    // event LogInvest(address investor, uint256 ethAmount, uint256 tokenPrice, uint256 tokenAmount);

    event LogDebugInteger(uint256 integer);

    constructor() public {
        owner = msg.sender;

        /* Set OAR for use with ethereum-bridge, remove for productio  */
        OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
        token = 1 ether;
    }

    function kill() external {
        require(msg.sender == owner, "Only the owner can kill this contract");
        selfdestruct(owner);
    }

    function fund() external payable {}
    function() external payable {}

    function bet(uint8 number) external payable {
        require(msg.value <= getMaxBet(), "Bet amount can not exceed max bet size");
        require(msg.value > 0, "A bet should be placed");

        updateTokenValue(address(this).balance - msg.value, msg.value, CashflowType.Inflow);

        emit LogBet(msg.sender, msg.value, number);
        bytes32 qid = oraclize_query("WolframAlpha", "random integer between 0 and 1");

        /* Store a player's info to retrieve it in the oraclize callback */
        players[qid] = PlayerInfo(msg.sender, msg.value, number);
    }

    function __callback(bytes32 qid, string result) public {
        require(msg.sender == oraclize_cbAddress(), "Can only be called from oraclize callback address");
        require(players[qid].player != address(0), "Query needs an associated player");

        uint8 winningNumber = uint8(parseInt(result));
        PlayerInfo storage playerInfo = players[qid];

        emit LogPlay(playerInfo.player, playerInfo.betSize, playerInfo.betNumber, winningNumber);

        if (playerInfo.betNumber == winningNumber) {
            payout(playerInfo.player, playerInfo.betSize * 36);
        }

        delete players[qid];
    }

    function getMaxBet() public view returns (uint256) {
        /* See README for motivation behind max bet (0.2 %) */
        return address(this).balance / 100;
    }

    function payout(address winner, uint256 amount) internal {
        require(amount > 0);
        require(amount <= address(this).balance);

        updateTokenValue(address(this).balance, amount, CashflowType.Outflow);

        winner.transfer(amount);
        emit LogPayout(winner, amount);
    }

    function updateTokenValue(uint256 _balance, uint256 _change, CashflowType _cashflowType) internal returns (uint256) {
        emit LogDebugInteger(_balance);
        emit LogDebugInteger(_change);

        /* Calculates multiplier as a percentage change that the change presents relative to the total balance */
        uint256 multiplier = (_change * 1 ether) / _balance;
        if (_cashflowType == CashflowType.Inflow) {
            multiplier = 1 ether + multiplier;
        } else {
            multiplier = 1 ether - multiplier;
        }

        emit LogDebugInteger(multiplier);
        token = token * multiplier / 1 ether;
    }
}
