pragma solidity ^0.5.0;

import "./BackingContract.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/**
 * @title BackedToken
 * @author Rosco Kalis <roscokalis@gmail.com>
 */
contract BackedToken is ERC20 {
    BackingContract public backingContract;

    event Buy(address indexed buyer, uint256 ethAmount, uint256 tokenPrice, uint256 tokenAmount);
    event Sell(address indexed seller, uint256 ethAmount, uint256 tokenPrice, uint256 tokenAmount);

    modifier onlyWhenBacked() {
        require(address(backingContract) != address(0), "Can only be executed with a backing contract");
        _;
    }

    modifier onlyWhenNotBacked() {
        require(address(backingContract) == address(0), "Can only be executed without a backing contract");
        _;
    }

    modifier onlyBackingContract() {
        require(msg.sender == address(backingContract), "Can only be executed by backing contract");
        _;
    }

    /**
     * @dev Fallback payable function forwarding funds to the backing contract.
     */
    function() external payable onlyWhenBacked {
        backingContract.deposit.value(msg.value)();
    }

    /**
     * @notice Payable function used by the backing contract to put funds back in the backed token contract.
     */
    function deposit() external payable onlyWhenBacked onlyBackingContract {}

    /**
     * @notice Backs this token using the passed backing contract address.
     * @dev Only used in initialisation.
     * @param backingContractAddress The address of a BackingContract that will back this token.
     */
    function back(address payable backingContractAddress) external onlyWhenNotBacked {
        backingContract = BackingContract(backingContractAddress);
    }

    /**
     * @notice Buys an amount of tokens.
     * @dev Uses the conversion functions.
     * @dev Emits Buy event.
     */
    function buy() external payable onlyWhenBacked {
        require(msg.value > 0, "A purchase should be made");

        uint256 tokenAmount = convertEthToToken(msg.value);
        uint256 currentTokenPrice = tokenPrice();
        _mint(msg.sender, tokenAmount);

        backingContract.deposit.value(msg.value)();

        emit Buy(msg.sender, msg.value, currentTokenPrice, tokenAmount);
    }

    /**
     * @notice Sells an amount of tokens and withdraws the corresponding eth from the backing contract.
     * @dev Uses the conversion functions.
     * @dev Emits Sell event.
     * @param tokenAmount The amount of tokens to sell.
     */
    function sell(uint256 tokenAmount) external onlyWhenBacked {
        require(tokenAmount <= balanceOf(msg.sender), "Can not divest more than investment");

        uint256 ethAmount = convertTokenToEth(tokenAmount);
        uint256 currentTokenPrice = tokenPrice();
        _burn(msg.sender, tokenAmount);

        backingContract.withdraw(ethAmount);
        msg.sender.transfer(ethAmount);

        emit Sell(msg.sender, ethAmount, currentTokenPrice, tokenAmount);
    }

    /**
     * @notice Returns the token price, which is derived from the backing contract's balance and total token supply.
     * @return The token price.
     */
    function tokenPrice() public view onlyWhenBacked returns (uint256) {
        if (totalSupply() == 0 || backingContract.balanceForBacking() == 0) {
            return 1 ether;
        }
        return backingContract.balanceForBacking().mul(1 ether).div(totalSupply());
    }

    /**
     * @notice Converts an amount of eth to an amount of tokens.
     * @param ethAmount The amount of eth to convert.
     */
    function convertEthToToken(uint256 ethAmount) public view onlyWhenBacked returns (uint256) {
        return ethAmount.mul(1 ether).div(tokenPrice());
    }

    /**
     * @notice Converts an amount of tokens to an amount of eth.
     * @param tokenAmount The amount of tokens to convert.
     */
    function convertTokenToEth(uint256 tokenAmount) public view onlyWhenBacked returns (uint256) {
        return tokenPrice().mul(tokenAmount).div(1 ether);
    }
}
