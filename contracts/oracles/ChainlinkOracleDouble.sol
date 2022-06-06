// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.6;

import "../interfaces/IPriceOracle.sol";
import "../interfaces/AggregatorV3Interface.sol";

/// @title Implementation of an Oracle using ChainLink aggregators as a data source
contract ChainlinkOracleDouble is IPriceOracle {
    AggregatorV3Interface public oracle1;
    AggregatorV3Interface public oracle2;

    constructor (address oracleAddr1, address oracleAddr2) {
        require(oracleAddr1 != address(0), "oracle cannot be 0x0");
        require(oracleAddr2 != address(0), "oracle cannot be 0x0");
        oracle1 = AggregatorV3Interface(oracleAddr1);
        oracle2 = AggregatorV3Interface(oracleAddr2);
    }

    function getPrice() public view override returns (uint256) {
        (, int price1, , ,) = oracle1.latestRoundData();
        (, int price2, , ,) = oracle2.latestRoundData();

        return uint256(price1) * uint256(price2) / 10**oracle1.decimals();
    }
}
