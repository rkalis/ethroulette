pragma solidity ^0.4.23;

import "./Roulette.sol";

/**
 * @title RouletteForTesting
 * @author Rosco Kalis <roscokalis@gmail.com>
 */
contract RouletteForTesting is Roulette {

    /**
     * @notice Kills the contract, can only be executed by the owner.
     */
    function kill() external onlyOwner {
        selfdestruct(owner);
    }

    /**
     * @notice Overrides the existing bet function, always takes 1 as winning number.
     * @param number The number that is bet on.
     */
    function bet(uint8 number) external payable {
        require(msg.value <= getMaxBet(), "Bet amount can not exceed max bet size");
        require(msg.value > 0, "A bet should be placed");

        emit Bet(msg.sender, msg.value, number);

        /* Always return 1 for testing */
        bytes32 qid = oraclize_query("WolframAlpha", "random integer between 0 and 0");

        /* Store a player's info to retrieve it in the oraclize callback */
        players[qid] = PlayerInfo(msg.sender, msg.value, number);
    }

    // /**
    //  * @notice Overrides the existing payout function so it is public and can be tested.
    //  * @param winner The account of the bet winner.
    //  * @param amount The amount to be paid out to the bet winner.
    //  */
    // function payout(address winner, uint256 amount) public {
    //     require(amount > 0, "Payout amount should be more than 0");
    //     require(amount <= address(this).balance, "Payout amount should not be more than contract balance");

    //     winner.transfer(amount);
    //     emit Payout(winner, amount);
    // }
}
