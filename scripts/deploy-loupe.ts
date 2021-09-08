import { deployContract } from "../test/helpers/deploy";

async function main () {
    const loupe = await deployContract("SmartAlphaLoupe", []);
    console.log(`Loupe deployed to: ${loupe.address}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
