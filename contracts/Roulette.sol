pragma solidity ^0.4.23;

import "oraclize-api/contracts/usingOraclize.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

// TODO: Safe math

/**
 * @title Roulette
 * @author Rosco Kalis <roscokalis@gmail.com>
 */
contract Roulette is usingOraclize, ERC20Basic, Ownable {
    uint256 internal internalTotalSupply;

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
        // Set OAR for use with ethereum-bridge, remove for production
        OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
    }

    /**
     * @dev Fallback payable function.
     */
    function() public payable {}

    // ERC20Basic functions

    /**
     * @notice Returns the current total token supply.
     * @return The total token supply.
     */
    function totalSupply() public view returns(uint256) {
        return internalTotalSupply;
    }

    /**
     * @notice Retrieves the token balance of an account.
     * @param who Account whose balance should be retrieved.
     * @return The account's token balance.
     */
    function balanceOf(address who) public view returns (uint256) {
        return investorBalances[who];
    }

    /**
     * @notice Transfers tokens from the account of the caller to a different account.
     * @dev Emits Transfer event.
     * @param to Recipient of the tokens.
     * @param value Amount of tokens to be transferred.
     * @return True.
     */
    function transfer(address to, uint256 value) public returns (bool) {
        require(value <= investorBalances[msg.sender], "Transfer amount can not be more than balance");
        require(to != address(0), "Can not transfer tokens to address(0)");

        investorBalances[msg.sender] -= value;
        investorBalances[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    // ///////////////////////

    // Investment functions

    /**
     * @notice Invests an amount of eth into the casino.
     * @dev Uses the conversion functions.
     * @dev Emits Invest event.
     */
    function invest() external payable {
        require(msg.value > 0, "An investment should be made");

        uint256 tokenAmount = convertEthToToken(msg.value);
        investorBalances[msg.sender] += tokenAmount;
        internalTotalSupply += tokenAmount;

        emit Invest(msg.sender, msg.value, tokenPrice(), tokenAmount);
    }

    /**
     * @notice Divests an amount of tokens and withdraws the corresponding eth from the casino.
     * @dev Uses the conversion functions.
     * @dev Emits Divest event.
     * @param tokenAmount The amount of tokens to divest from the contract.
     */
    function divest(uint256 tokenAmount) external {
        require(tokenAmount <= investorBalances[msg.sender], "Can not divest more than investment");

        uint256 ethAmount = convertTokenToEth(tokenAmount);
        investorBalances[msg.sender] -= tokenAmount;
        internalTotalSupply -= tokenAmount;
        msg.sender.transfer(ethAmount);

        emit Divest(msg.sender, ethAmount, tokenPrice(), tokenAmount);
    }

    // ///////////////////////

    // Betting functions

    /**
     * @notice Bets an amount of eth on a specific number.
     * @dev Updates token price according to value change.
     * @dev Stores the player info in `players` mapping so it can be retrieved in `__callback()`.
     * @dev Emits Bet event.
     * @param number The number that is bet on.
     */
    function bet(uint8 number) external payable {
        require(msg.value <= getMaxBet(), "Bet amount can not exceed max bet size");
        require(msg.value > 0, "A bet should be placed");

        emit Bet(msg.sender, msg.value, number);
        bytes32 qid = oraclize_query("WolframAlpha", "random integer between 0 and 36");

        /* Store a player's info to retrieve it in the oraclize callback */
        players[qid] = PlayerInfo(msg.sender, msg.value, number);
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

        emit Play(playerInfo.player, playerInfo.betSize, playerInfo.betNumber, winningNumber);

        if (playerInfo.betNumber == winningNumber) {
            payout(playerInfo.player, playerInfo.betSize * 36);
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
    function payout(address winner, uint256 amount) internal {
        require(amount > 0, "Payout amount should be more than 0");
        require(amount <= address(this).balance, "Payout amount should not be more than contract balance");

        winner.transfer(amount);
        emit Payout(winner, amount);
    }

    // ///////////////////////

    // Utility functions

    /**
     * @notice Returns the token price, which is derived from the balance and total supply.
     * @return The token price.
     */
    function tokenPrice() public view returns (uint256) {
        if (totalSupply() == 0 || address(this).balance == 0) {
            return 1 ether;
        }
        return (address(this).balance * 1 ether) / totalSupply();
    }

    /**
     * @notice Returns the maximum bet (0.2% of balance) for this contract.
     * @dev Based on empirical statistics (see README).
     * @return The maximum bet.
     */
    function getMaxBet() public view returns (uint256) {
        return address(this).balance / 500;
    }

    /**
     * @notice Converts an amount of eth to an amount of tokens.
     * @param ethAmount The amount of eth to convert.
     */
    function convertEthToToken(uint256 ethAmount) public view returns (uint256) {
        return (ethAmount * 1 ether) / tokenPrice();
    }

    /**
     * @notice Converts an amount of tokens to an amount of eth.
     * @param tokenAmount The amount of tokens to convert.
     */
    function convertTokenToEth(uint256 tokenAmount) public view returns (uint256) {
        return (tokenPrice() * tokenAmount) / 1 ether;
    }

    // ///////////////////////
}
