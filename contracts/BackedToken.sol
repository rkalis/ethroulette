pragma solidity ^0.4.24;

import "./BackingContract.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title BackedToken
 * @author Rosco Kalis <roscokalis@gmail.com>
 */
contract BackedToken is ERC20Basic {
    using SafeMath for uint256;

    BackingContract public backingContract;

    uint256 internal internalTotalSupply;

    mapping(address=>uint256) balances;

    event Buy(address indexed buyer, uint256 ethAmount, uint256 tokenPrice, uint256 tokenAmount);
    event Sell(address indexed seller, uint256 ethAmount, uint256 tokenPrice, uint256 tokenAmount);
    event Transfer(address indexed from, address indexed to, uint256 value);

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
    function() public payable onlyWhenBacked {
        backingContract.deposit.value(msg.value)();
    }

    /**
     * @notice Payable function used by the backing contract to put funds back in the backed token contract..
     */
    function deposit() external payable onlyWhenBacked onlyBackingContract {}

    /**
     * @notice Backs this token using the passed backing contract address.
     * @dev Only used in initialisation.
     * @param backingContractAddress The address of a BackingContract that will back this token.
     * @return The total token supply.
     */
    function back(address backingContractAddress) external onlyWhenNotBacked {
        backingContract = BackingContract(backingContractAddress);
    }

    /**
     * @notice Returns the current total token supply.
     * @return The total token supply.
     */
    function totalSupply() public view onlyWhenBacked returns (uint256) {
        return internalTotalSupply;
    }

    /**
     * @notice Retrieves the token balance of an account.
     * @param who Account whose balance should be retrieved.
     * @return The account's token balance.
     */
    function balanceOf(address who) public view onlyWhenBacked returns (uint256) {
        return balances[who];
    }

    /**
     * @notice Transfers tokens from the account of the caller to a different account.
     * @dev Emits Transfer event.
     * @param to Recipient of the tokens.
     * @param value Amount of tokens to be transferred.
     * @return True.
     */
    function transfer(address to, uint256 value) public onlyWhenBacked returns (bool) {
        require(value <= balances[msg.sender], "Transfer amount can not be more than balance");
        require(to != address(0), "Can not transfer tokens to address(0)");

        balances[msg.sender] = balances[msg.sender].sub(value);
        balances[to] = balances[to].add(value);
        emit Transfer(msg.sender, to, value);
        return true;
    }

    /**
     * @notice Buys an amount of tokens
     * @dev Uses the conversion functions.
     * @dev Emits Buy event.
     */
    function buy() external payable onlyWhenBacked {
        require(msg.value > 0, "A purchase should be made");

        uint256 tokenAmount = convertEthToToken(msg.value);
        uint256 currentTokenPrice = tokenPrice();
        balances[msg.sender] = balances[msg.sender].add(tokenAmount);
        internalTotalSupply = internalTotalSupply.add(tokenAmount);

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
        require(tokenAmount <= balances[msg.sender], "Can not divest more than investment");

        uint256 ethAmount = convertTokenToEth(tokenAmount);
        uint256 currentTokenPrice = tokenPrice();
        balances[msg.sender] = balances[msg.sender].sub(tokenAmount);
        internalTotalSupply = internalTotalSupply.sub(tokenAmount);

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
