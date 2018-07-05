pragma solidity 0.4.23;

contract Roulette {
    uint256 internal maxBetDivisor;
    address public owner;

    event PlayEvent(address player, uint256 betSize, uint8 betNumber, uint8 winningNumber);
    event PayoutEvent(address winner, uint256 payout);

    constructor(uint256 _maxBetDivisor) public {
        owner = msg.sender;
        if (_maxBetDivisor == 0) {
            maxBetDivisor = 100;
        } else {
            maxBetDivisor = _maxBetDivisor;
        }
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

        uint8 winningNumber = generateWinningNumber();
        emit PlayEvent(msg.sender, msg.value, number, winningNumber);

        if (number == winningNumber) {
            payout(msg.sender, msg.value * 36);
        }
    }

    function getMaxBet() public view returns (uint256) {
        return address(this).balance / maxBetDivisor;
    }

    function generateWinningNumber() internal view returns (uint8) {
        return uint8(block.number % 37);
    }

    function payout(address winner, uint256 amount) internal {
        require(amount > 0);
        require(amount <= address(this).balance);
        winner.transfer(amount);
        emit PayoutEvent(winner, amount);
    }
}
