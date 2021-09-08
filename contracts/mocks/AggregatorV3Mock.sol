// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.6;

import "../interfaces/AggregatorV3Interface.sol";

contract AggregatorV3Mock is AggregatorV3Interface {
    int256 _answer;
    uint8 _decimals = 8;

    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function description() external pure override returns (string memory) {
        return "";
    }

    function version() external pure override returns (uint256) {
        return 0;
    }

    function getRoundData(
        uint80 //_roundId
    ) external pure override returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (0, 0, 0, 0, 0);
    }

    function latestRoundData()
    external
    view
    override
    returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (0, _answer, 0, 0, 0);
    }

    function setAnswer(int256 _a) public {
        _answer = _a;
    }

    function setDecimals(uint8 _dec) public {
        _decimals = _dec;
    }
}
