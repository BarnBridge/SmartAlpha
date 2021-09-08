import { deployContract } from "../test/helpers/deploy";

async function main () {
    const factory = await deployContract("PoolFactory", ["0x89d652C64d7CeE18F5DF53B24d9D29D130b18798"]);
    console.log(`PoolFactory deployed to: ${factory.address}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
