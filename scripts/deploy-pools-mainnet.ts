import { ERC20, PoolFactory } from "../typechain";
import { contractAt } from "../test/helpers/helpers";
import * as time from "../test/helpers/time";

const factoryAddress = "0xFb2859365084C653d41d6E1109d6EB3c6a31738B";

const pools = [
    {
        poolName: "WETH-USD-1w",
        oracleAsset: "USD",
        dao: "0x89d652C64d7CeE18F5DF53B24d9D29D130b18798",
        guardian: "0x54e6a2f9991b6b6d57d152d21427e8cb80b25e91",
        poolToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        chainlinkAggregator: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
        chainlinkOracleReverse: false,
        epoch1Start: Date.UTC(2021, 8, 13, 14),
        epochDuration: 7 * time.day,
    },
    {
        poolName: "WBTC-USD-1w",
        oracleAsset: "USD",
        dao: "0x89d652C64d7CeE18F5DF53B24d9D29D130b18798",
        guardian: "0x54e6a2f9991b6b6d57d152d21427e8cb80b25e91",
        poolToken: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        chainlinkAggregator: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
        chainlinkOracleReverse: false,
        epoch1Start: Date.UTC(2021, 8, 13, 14),
        epochDuration: 7 * time.day,
    },
    {
        poolName: "WETH-BTC-1w",
        oracleAsset: "BTC",
        dao: "0x89d652C64d7CeE18F5DF53B24d9D29D130b18798",
        guardian: "0x54e6a2f9991b6b6d57d152d21427e8cb80b25e91",
        poolToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        chainlinkAggregator: "0xdeb288F737066589598e9214E782fa5A8eD689e8",
        chainlinkOracleReverse: true,
        epoch1Start: Date.UTC(2021, 8, 13, 14),
        epochDuration: 7 * time.day,
    },
    {
        poolName: "WBTC-ETH-1w",
        oracleAsset: "ETH",
        dao: "0x89d652C64d7CeE18F5DF53B24d9D29D130b18798",
        guardian: "0x54e6a2f9991b6b6d57d152d21427e8cb80b25e91",
        poolToken: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        chainlinkAggregator: "0xdeb288F737066589598e9214E782fa5A8eD689e8",
        chainlinkOracleReverse: false,
        epoch1Start: Date.UTC(2021, 8, 13, 14),
        epochDuration: 7 * time.day,
    },
];

async function main () {
    const factory = (await contractAt("PoolFactory", factoryAddress)) as PoolFactory;

    console.log(`Will deploy ${pools.length} pools ...`);

    for (const pool of pools) {
        const juniorTokenName = `BarnBridge ${pool.poolName} junior token`;
        const juniorTokenSymbol = `junior_${pool.poolName}`;
        const seniorTokenName = `BarnBridge ${pool.poolName} senior token`;
        const seniorTokenSymbol = `senior_${pool.poolName}`;

        const tx = await factory.deploy(
            pool.dao,
            pool.guardian,
            pool.poolToken,
            pool.chainlinkAggregator,
            juniorTokenName,
            juniorTokenSymbol,
            seniorTokenName,
            seniorTokenSymbol,
            Math.floor(pool.epoch1Start / 1000),
            pool.epochDuration,
            pool.chainlinkOracleReverse,
        );

        await tx.wait(2);

        const nr = await factory.numberOfPools();
        const p = await factory.pools(nr.sub(1));

        const token = (await contractAt("ERC20", pool.poolToken)) as ERC20;

        console.log(`
{
  "poolName": "${pool.poolName}",
  "poolAddress": "${p.smartAlpha}",
  "poolToken": {
    "address": "${pool.poolToken}",
    "symbol": "${await token.symbol()}",
    "decimals": ${await token.decimals()}
  },
  "juniorTokenAddress": "${p.juniorToken}",
  "juniorTokenSymbol" : "${juniorTokenSymbol}",
  "seniorTokenAddress": "${p.seniorToken}",
  "seniorTokenSymbol": "${seniorTokenSymbol}",
  "oracleAddress": "${p.oracle}",
  "oracleAssetSymbol": "${pool.oracleAsset}",
  "seniorRateModelAddress":"${p.seniorRateModel}",
  "accountingModelAddress":"${p.accountingModel}",
  "epoch1Start": ${Math.floor(pool.epoch1Start / 1000)},
  "epochDuration": ${pool.epochDuration},
  "startAtBlock": ${tx.blockNumber}
},
        `);
    }

    console.log("Done");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
