pragma solidity ^0.5.0;

import "./Roulette.sol";

/**
 * @title RouletteForTesting
 * @author Rosco Kalis <roscokalis@gmail.com>
 * @dev This contract extends the Roulette contract, but with deterministic win conditions,
 * to test the betting functionality.
 */
contract RouletteForTesting is Roulette {
    constructor(address payable roscoinAddress) Roulette(roscoinAddress) public {}

    /**
     * @notice Overrides the existing bet function, always takes 1 as winning number.
     * @param number The number that is bet on.
     */
    function bet(uint8 number) external payable whenNotPaused {
        require(msg.value <= maxBet(), "Bet amount can not exceed max bet size");

        uint256 oraclizeFee = oraclize_getPrice("WolframAlpha");
        require(msg.value > oraclizeFee, "Bet amount should be higher than oraclize fee");

        uint256 betValue = msg.value - oraclizeFee;

        bytes32 qid = oraclize_query("WolframAlpha", "random integer between 0 and 0");

        /* Store a player's info to retrieve it in the oraclize callback */
        players[qid] = PlayerInfo(msg.sender, betValue, number);
        emit Bet(msg.sender, qid, betValue, number);
    }
}
