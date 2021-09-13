import { deployContract } from "../test/helpers/deploy";

async function main () {
    const model = await deployContract("SeniorRateModelV3", []);
    console.log(`Model deployed to: ${model.address}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
