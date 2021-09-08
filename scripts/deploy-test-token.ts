import { deployContract } from "../test/helpers/deploy";

async function main () {
    const token = await deployContract("ERC20Test", ["WBTC test", "WBTC", 8]);
    console.log(`Token deployed to: ${token.address}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
