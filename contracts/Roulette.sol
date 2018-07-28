pragma solidity ^0.4.23;

import "oraclize-api/contracts/usingOraclize.sol";
import "zeppelin/contracts/token/ERC20Basic.sol";

// TODO: Safe math

contract Roulette is usingOraclize, ERC20Basic {
    uint256 public tokenPrice;
    uint256 public totalSupply;
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

    mapping(address=>uint256) investorBalances;
    mapping(bytes32=>PlayerInfo) players;

    event Bet(address indexed player, uint256 betSize, uint8 betNumber);
    event Play(address indexed player, uint256 betSize, uint8 betNumber, uint8 winningNumber);
    event Payout(address indexed winner, uint256 payout);
    event Invest(address indexed investor, uint256 ethAmount, uint256 tokenPrice, uint256 tokenAmount);
    event Divest(address indexed investor, uint256 ethAmount, uint256 tokenPrice, uint256 tokenAmount);
    event Transfer(address indexed from, address indexed to, uint256 value);

    event LogDebugInteger(uint256 integer);

    constructor() public {
        owner = msg.sender;

        /* Set OAR for use with ethereum-bridge, remove for productio  */
        OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
        tokenPrice = 1 ether;
    }

    function kill() external {
        require(msg.sender == owner, "Only the owner can kill this contract");
        selfdestruct(owner);
    }

    function() external payable {}

    // ERC20Basic functions

    function balanceOf(address who) public view returns (uint256) {
        return investorBalances[who];
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(value <= investorBalances[msg.sender]);
        require(to != address(0));

        investorBalances[msg.sender] -= value;
        investorBalances[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    // ///////////////////////

    // Investment functions

    function invest() external payable {
        require(msg.value > 0, "An investment should be made");

        uint256 tokenAmount = convertEthToToken(msg.value);
        investorBalances[msg.sender] += tokenAmount;

        emit Invest(msg.sender, msg.value, tokenPrice, tokenAmount);
    }

    function divest(uint256 tokenAmount) external {
        require(tokenAmount <= investorBalances[msg.sender], "Can not divest more than investment");

        investorBalances[msg.sender] -= tokenAmount;

        uint256 ethAmount = convertTokenToEth(tokenAmount);
        msg.sender.transfer(ethAmount);

        emit Divest(msg.sender, ethAmount, tokenPrice, tokenAmount);
    }

    function convertEthToToken(uint256 ethAmount) public view returns (uint256) {
        return (ethAmount * 1 ether) / tokenPrice;
    }

    function convertTokenToEth(uint256 tokenAmount) public view returns (uint256) {
        return (tokenPrice * tokenAmount) / 1 ether;
    }

    // ///////////////////////

    // Betting functions

    function bet(uint8 number) external payable {
        require(msg.value <= getMaxBet(), "Bet amount can not exceed max bet size");
        require(msg.value > 0, "A bet should be placed");

        updateTokenPrice(address(this).balance - msg.value, msg.value, CashflowType.Inflow);

        emit Bet(msg.sender, msg.value, number);
        bytes32 qid = oraclize_query("WolframAlpha", "random integer between 0 and 1");

        /* Store a player's info to retrieve it in the oraclize callback */
        players[qid] = PlayerInfo(msg.sender, msg.value, number);
    }

    function __callback(bytes32 qid, string result) public {
        require(msg.sender == oraclize_cbAddress(), "Can only be called from oraclize callback address");
        require(players[qid].player != address(0), "Query needs an associated player");

        uint8 winningNumber = uint8(parseInt(result));
        PlayerInfo storage playerInfo = players[qid];

        emit Play(playerInfo.player, playerInfo.betSize, playerInfo.betNumber, winningNumber);

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

        updateTokenPrice(address(this).balance, amount, CashflowType.Outflow);

        winner.transfer(amount);
        emit Payout(winner, amount);
    }

    // ///////////////////////

    function updateTokenPrice(uint256 _balance, uint256 _change, CashflowType _cashflowType) internal returns (uint256) {
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
        tokenPrice = tokenPrice * multiplier / 1 ether;
    }
}
