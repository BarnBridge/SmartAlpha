// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./SmartAlpha.sol";
import "./models/AccountingModel.sol";
import "./models/SeniorRateModelV3.sol";
import "./oracles/ChainlinkOracle.sol";
import "./oracles/ChainlinkOracleReverse.sol";

contract PoolFactory is Ownable {
    struct Pool {
        SmartAlpha smartAlpha;
        ISeniorRateModel seniorRateModel;
        IAccountingModel accountingModel;
        OwnableERC20 juniorToken;
        OwnableERC20 seniorToken;
        IPriceOracle oracle;
    }

    Pool[] public pools;
    uint256 public numberOfPools;

    constructor (address owner) {
        transferOwnership(owner);
    }

    function deploy(
        address dao,
        address guardian,
        address poolToken,
        address chainlinkAggregator,
        string memory juniorTokenName,
        string memory juniorTokenSymbol,
        string memory seniorTokenName,
        string memory seniorTokenSymbol,
        uint256 epoch1Start,
        uint256 epochDuration,
        bool reverseOracle
    ) public onlyOwner {
        Pool memory p;
        p.smartAlpha = new SmartAlpha(address(this), guardian);
        p.seniorRateModel = new SeniorRateModelV3();
        p.accountingModel = new AccountingModel();

        if (reverseOracle) {
            p.oracle = new ChainlinkOracleReverse(chainlinkAggregator);
        } else {
            p.oracle = new ChainlinkOracle(chainlinkAggregator);
        }

        uint8 decimals = IERC20Metadata(poolToken).decimals();

        p.juniorToken = new OwnableERC20(juniorTokenName, juniorTokenSymbol, decimals);
        p.juniorToken.transferOwnership(address(p.smartAlpha));

        p.seniorToken = new OwnableERC20(seniorTokenName, seniorTokenSymbol, decimals);
        p.seniorToken.transferOwnership(address(p.smartAlpha));

        p.smartAlpha.initialize(
            poolToken,
            address(p.oracle),
            address(p.seniorRateModel),
            address(p.accountingModel),
            address(p.juniorToken),
            address(p.seniorToken),
            epoch1Start,
            epochDuration
        );

        p.smartAlpha.transferDAO(dao);

        pools.push(p);
        numberOfPools++;
    }
}
