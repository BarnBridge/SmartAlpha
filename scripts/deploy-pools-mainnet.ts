import { ERC20, PoolFactory } from "../typechain";
import { contractAt } from "../test/helpers/helpers";
import * as time from "../test/helpers/time";

const factoryAddress = "0xFb2859365084C653d41d6E1109d6EB3c6a31738B";

const pools = [
    // {
    //     poolName: "stkAAVE-USD-1w",
    //     oracleAsset: "USD",
    //     dao: "0x89d652C64d7CeE18F5DF53B24d9D29D130b18798",
    //     guardian: "0x54e6a2f9991b6b6d57d152d21427e8cb80b25e91",
    //     poolToken: "0x4da27a545c0c5b758a6ba100e3a049001de870f5",
    //     chainlinkAggregator: "0x547a514d5e3769680Ce22B2361c10Ea13619e8a9",
    //     chainlinkOracleReverse: false,
    //     epoch1Start: Date.UTC(2021, 8, 27, 14),
    //     epochDuration: 7 * time.day,
    // },
    // {
    //     poolName: "UNI-USD-1w",
    //     oracleAsset: "USD",
    //     dao: "0x89d652C64d7CeE18F5DF53B24d9D29D130b18798",
    //     guardian: "0x54e6a2f9991b6b6d57d152d21427e8cb80b25e91",
    //     poolToken: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    //     chainlinkAggregator: "0x553303d460EE0afB37EdFf9bE42922D8FF63220e",
    //     chainlinkOracleReverse: false,
    //     epoch1Start: Date.UTC(2021, 8, 27, 14),
    //     epochDuration: 7 * time.day,
    // },
    // {
    //     poolName: "LINK-USD-1w",
    //     oracleAsset: "USD",
    //     dao: "0x89d652C64d7CeE18F5DF53B24d9D29D130b18798",
    //     guardian: "0x54e6a2f9991b6b6d57d152d21427e8cb80b25e91",
    //     poolToken: "0x514910771af9ca656af840dff83e8264ecf986ca",
    //     chainlinkAggregator: "0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c",
    //     chainlinkOracleReverse: false,
    //     epoch1Start: Date.UTC(2021, 8, 27, 14),
    //     epochDuration: 7 * time.day,
    // },
    // {
    //     poolName: "xSUSHI-USD-1w",
    //     oracleAsset: "USD",
    //     dao: "0x89d652C64d7CeE18F5DF53B24d9D29D130b18798",
    //     guardian: "0x54e6a2f9991b6b6d57d152d21427e8cb80b25e91",
    //     poolToken: "0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272",
    //     chainlinkAggregator: "0xCc70F09A6CC17553b2E31954cD36E4A2d89501f7",
    //     chainlinkOracleReverse: false,
    //     epoch1Start: Date.UTC(2021, 8, 27, 14),
    //     epochDuration: 7 * time.day,
    // },

    {
        poolName: "FLOKI-USD-1w",
        oracleAsset: "USD",
        dao: "0x89d652C64d7CeE18F5DF53B24d9D29D130b18798",
        guardian: "0x54e6a2f9991b6b6d57d152d21427e8cb80b25e91",
        poolToken: "0x43f11c02439e2736800433b4594994bd43cd066d",
        chainlinkAggregator: "0xfbafc1f5b1b37cc0763780453d1ea635520708f2",
        chainlinkOracleReverse: false,
        epoch1Start: Date.UTC(2021, 11, 27, 14),
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

        const receipt = await tx.wait(2);

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
  "startAtBlock": ${receipt.blockNumber}
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
