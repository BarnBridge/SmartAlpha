import { ERC20, PoolFactory } from "../typechain";
import { contractAt } from "../test/helpers/helpers";
import * as time from "../test/helpers/time";

const factoryAddress = "0xc40a66AFB908789341A58B8423F89fE2cb7Dc1f9";

const pools = [
    {
        poolName: "WETH-USD-1w",
        oracleAsset: "USD",
        dao: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
        guardian: "0xB0d6177e4fD20C50916c6Edb54f7A45c5a5B2610",
        poolToken: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
        chainlinkAggregator: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
        chainlinkOracleReverse: false,
        epoch1Start: Date.UTC(2021, 8, 13, 14),
        epochDuration: 7 * time.day,
    },
    {
        poolName: "WBTC-USD-1w",
        oracleAsset: "USD",
        dao: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
        guardian: "0xB0d6177e4fD20C50916c6Edb54f7A45c5a5B2610",
        poolToken: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
        chainlinkAggregator: "0xDE31F8bFBD8c84b5360CFACCa3539B938dd78ae6",
        chainlinkOracleReverse: false,
        epoch1Start: Date.UTC(2021, 8, 13, 14),
        epochDuration: 7 * time.day,
    },
    {
        poolName: "WETH-BTC-1w",
        oracleAsset: "BTC",
        dao: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
        guardian: "0xB0d6177e4fD20C50916c6Edb54f7A45c5a5B2610",
        poolToken: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
        chainlinkAggregator: "0xA338e0492B2F944E9F8C0653D3AD1484f2657a37",
        chainlinkOracleReverse: true,
        epoch1Start: Date.UTC(2021, 9, 13, 14),
        epochDuration: 7 * time.day,
    },
    {
        poolName: "WBTC-ETH-1w",
        oracleAsset: "ETH",
        dao: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
        guardian: "0xB0d6177e4fD20C50916c6Edb54f7A45c5a5B2610",
        poolToken: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
        chainlinkAggregator: "0xA338e0492B2F944E9F8C0653D3AD1484f2657a37",
        chainlinkOracleReverse: false,
        epoch1Start: Date.UTC(2021, 8, 13, 14),
        epochDuration: 7 * time.day,
    },
    {
        poolName: "WMATIC-USD-1w",
        oracleAsset: "USD",
        dao: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
        guardian: "0xB0d6177e4fD20C50916c6Edb54f7A45c5a5B2610",
        poolToken: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
        chainlinkAggregator: "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0",
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
