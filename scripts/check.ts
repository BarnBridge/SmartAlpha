import { contractAt } from "../test/helpers/helpers";
import { ChainlinkOracle, ERC20, SmartAlpha } from "../typechain";

const pools = [
    "0x56f9ea7953DAcCb139ebC5473FF7D773D7D3E5d2",
    "0x346305BDB8c3DfA1796045E67b68965a7eEddC6D",
    "0xd10c67b59a370e29C7647a210cCD09aE979bE773",
    "0xaCD2c6b9f8Caf18cf182d6EFd8f1a7b0B0C6A141",
];

async function main () {
    for (const p of pools) {
        const sa = await contractAt("SmartAlpha", p) as SmartAlpha;

        const oracleAddr = await sa.priceOracle();
        const oracle = await contractAt("ChainlinkOracle", oracleAddr) as ChainlinkOracle;

        const poolTokenAddr = await sa.poolToken();
        const poolToken = await contractAt("ERC20", poolTokenAddr) as ERC20;

        const epoch1Start = await sa.epoch1Start();

        console.log(`
Pool ${p}:
- epoch 1 start: ${epoch1Start.toString()} (${(new Date(epoch1Start.toNumber() * 1000)).toISOString()})
- pool token: ${poolTokenAddr} (${(await poolToken.symbol()).toString()})

- current epoch: ${(await sa.getCurrentEpoch()).toString()}
- current jtoken price: ${(await sa.estimateCurrentJuniorTokenPrice()).toString()}
- current stoken price: ${(await sa.estimateCurrentSeniorTokenPrice()).toString()}

- oracle: ${oracleAddr}
- oracle price: ${(await oracle.getPrice()).toString()}
        `);
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
