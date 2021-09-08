// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.6;

import "../interfaces/IPriceOracle.sol";

contract OracleMock is IPriceOracle {
    uint256 public price;

    function getPrice() public view override returns(uint256) {
        return price;
    }

    function setPrice(uint256 val) public {
        price = val;
    }
}
