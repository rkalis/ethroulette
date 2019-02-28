pragma solidity ^0.5.0;

import "./BackedToken.sol";

contract Roscoin is BackedToken {
    string public name = "Roscoin";
    string public symbol = "ROS";
    uint8 public decimals = 18;
}
