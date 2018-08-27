# Unit Tests

I created 15 different unit tests across the three main contracts that were implemented (Roulette, BackedToken, BackingContract). Since a lot of the functionality of BackedToken and BackingContract is linked, I only added one test to the BackingContract test file.

## Backed Token
I decided not to test any regular ERC20 functionality, since I used OpenZeppelin's StandardToken as a base for all standard ERC20 functionality. I only tested the functionality unique to BackedToken (ie the backing and buying/selling).

I tested that it can be backed only by an instance of BackingContract, and that the BackingContract can not be changed after it has been initially set for security.

Next, I tested that the token can be bought, and that all proceedings of this purchase are sent to the linked BackingContract.

Finally, I tested that owned tokens can be sold again, and that all proceedings of this sale are taken from the linked BackingContract.

## Roulette
For the Roulette, I tested the bet contraints; the bet needs to be between the minimum and maximum bet.

Next, I tested the winning and losing functionality; betting on the right number causes the player to win (and be paid out), while betting on the wrong number causes them to lose. I also tested that a fee is deducted for Oraclize when playing for the second time (as the first one is free). TO deterministically test the winning and losing of the bets I extended Roulette.sol into RouletteForTesting.sol, which only overrides the bet function to always return 0 as the winning number.

Finally, I tested the correct functioning of the emergency stop pattern, by asserting that all betting operations are disabled during a pause.

## Using events in unit tests
Events are often used as a way to retrieve data from blockchain transactions to pull them into the frontend application. This shows that it is a great way to unit test smart contract functionality as well, since it can easily retrieve detailed information about the execution of transactions. This is why I made extensive use of my [truffle-assertions](https://github.com/rkalis/truffle-assertions) library, to leverage the power of events for unit testing.
