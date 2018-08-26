pragma solidity ^0.4.24;

import "./BackingContract.sol";
import "oraclize-api/contracts/usingOraclize.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

/**
 * @title Roulette
 * @author Rosco Kalis <roscokalis@gmail.com>
 */
contract Roulette is usingOraclize, Pausable, BackingContract {
    using SafeMath for uint256;

    struct PlayerInfo {
        address player;
        uint256 betSize;
        uint8 betNumber;
    }

    mapping(bytes32=>PlayerInfo) players;

    event Bet(address indexed player, uint256 betSize, uint8 betNumber, bytes32 qid);
    event Play(address indexed player, uint256 betSize, uint8 betNumber, uint8 winningNumber, bytes32 qid);
    event Payout(address indexed winner, uint256 payout);

    constructor(address roscoinAddress) BackingContract(roscoinAddress) public {
        // Set OAR for use with ethereum-bridge, remove for production
        OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
    }

    // Betting functions

    /**
     * @notice Bets an amount of eth on a specific number.
     * @dev Updates token price according to value change.
     * @dev Stores the player info in `players` mapping so it can be retrieved in `__callback()`.
     * @dev Emits Bet event.
     * @param number The number that is bet on.
     */
    function bet(uint8 number) external payable whenNotPaused {
        require(msg.value <= maxBet(), "Bet amount can not exceed max bet size");

        uint256 oraclizeFee = oraclize_getPrice("WolframAlpha");
        require(msg.value > oraclizeFee, "Bet amount should be higher than oraclize fee");

        uint256 betValue = msg.value - oraclizeFee;

        bytes32 qid = oraclize_query("WolframAlpha", "random integer between 0 and 36");

        /* Store a player's info to retrieve it in the oraclize callback */
        players[qid] = PlayerInfo(msg.sender, betValue, number);
        emit Bet(msg.sender, betValue, number, qid);
    }

    /**
     * @notice Callback function for Oraclize, checks if the player won the bet, and payd out if they did.
     * @dev Uses the `players` mapping to retrieve a player's information, deletes the player information afterwards.
     * @dev Emits Play event.
     * @param qid The query id of the corresponding Oraclize query.
     * @param result The result of the Oraclize query.
     */
    function __callback(bytes32 qid, string result) public {
        require(msg.sender == oraclize_cbAddress(), "Can only be called from oraclize callback address");
        require(players[qid].player != address(0), "Query needs an associated player");

        uint8 winningNumber = uint8(parseInt(result));
        PlayerInfo storage playerInfo = players[qid];

        emit Play(playerInfo.player, playerInfo.betSize, playerInfo.betNumber, winningNumber, qid);
        balanceForBacking = balanceForBacking.add(playerInfo.betSize);

        if (playerInfo.betNumber == winningNumber) {
            payout(playerInfo.player, playerInfo.betSize.mul(36));
        }

        // TODO: Perhaps delete this info before sending payout (reentrancy)
        delete players[qid];
    }

    /**
     * @notice Pays out an amount of eth to a bet winner.
     * @dev Updates token price according to value change.
     * @dev Emits Payout event.
     * @param winner The account of the bet winner.
     * @param amount The amount to be paid out to the bet winner.
     */
    function payout(address winner, uint256 amount) internal whenNotPaused {
        require(amount > 0, "Payout amount should be more than 0");
        require(amount <= address(this).balance, "Payout amount should not be more than contract balance");

        balanceForBacking = balanceForBacking.sub(amount);
        winner.transfer(amount);
        emit Payout(winner, amount);
    }

    // ///////////////////////

    // Utility functions

    /**
     * @notice Returns the maximum bet (0.5% of balance) for this contract.
     * @dev Based on empirical statistics (see docs/max_bet_size.md).
     * @return The maximum bet.
     */
    function maxBet() public view returns (uint256) {
        return address(this).balance.div(200) + oraclizeFeeEstimate();
    }

    /**
     * @notice Returns an estimate of the oraclize fee.
     * @return An estimate of the oraclize fee.
     */
    function oraclizeFeeEstimate() public view returns (uint256) {
        return 0.004 ether;
    }

    /**
     * @notice Returns whether bet with qid is currently active.
     * @param qid The qid of the bet
     * @return Whether the qid is currently playing.
     */
    function isCurrentlyPlaying(bytes32 qid) public view returns (bool) {
        return players[qid].player != address(0);
    }

    // ///////////////////////
}
