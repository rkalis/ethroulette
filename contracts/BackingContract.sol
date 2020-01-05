pragma solidity ^0.5.0;

import "./BackedToken.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title BackingContract
 * @author Rosco Kalis <roscokalis@gmail.com>
 */
contract BackingContract {
    using SafeMath for uint256;

    BackedToken public backedToken;
    uint256 public balanceForBacking;

    modifier onlyBackedToken() {
        require(msg.sender == address(backedToken), "Can only be called by the backed token contract");
        _;
    }

    /**
     * @dev Fallback payable function, adding the new funds to balanceForBacking.
     */
    function() external payable {
        balanceForBacking = balanceForBacking.add(msg.value);
    }

    /**
     * @notice Sets the backed token and backs it.
     * @param backedTokenAddress The address of the deployed backed token.
     */
    constructor(address payable backedTokenAddress) public {
        backedToken = BackedToken(backedTokenAddress);
        backedToken.back(address(this));
    }

    /**
     * @notice Allows the backed token to deposit funds into the contract.
     * @dev Funds are added to balanceForBacking as well.
     */
    function deposit() external payable onlyBackedToken {
        balanceForBacking = balanceForBacking.add(msg.value);
    }

    /**
     * @notice Allows the backed token to withdraw funds from the contract.
     * @dev Funds are removed from balanceForBacking as well.
     * @param ethAmount The amount of eth to withdraw.
     */
    function withdraw(uint256 ethAmount) external onlyBackedToken {
        require(ethAmount <= address(this).balance, "Can not withdraw more than balance");
        require(ethAmount <= balanceForBacking, "Can not withdraw more than balance for backing");
        balanceForBacking = balanceForBacking.sub(ethAmount);
        backedToken.deposit.value(ethAmount)();
    }
}
