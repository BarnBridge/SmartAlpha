// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IOwnableERC20 is IERC20 {
    function mint(address user, uint256 amount) external;
    function burn(address user, uint256 amount) external;
    function transferAsOwner(address sender, address recipient, uint256 amount) external returns(bool);
}
