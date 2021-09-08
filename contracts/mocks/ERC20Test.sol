// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20Test is Ownable, ERC20 {
    uint8 private _dec;

    constructor(string memory name, string memory symbol, uint8 _decimals) ERC20(name, symbol) {
        _dec = _decimals;
    }

    function decimals() public view override returns (uint8) {
        return _dec;
    }

    function mint(address user, uint256 amount) public onlyOwner {
        _mint(user, amount);
    }

    function burn(address user, uint256 amount) public onlyOwner {
        _burn(user, amount);
    }
}
