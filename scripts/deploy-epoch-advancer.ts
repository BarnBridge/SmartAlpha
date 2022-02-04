import { deployContract } from "../test/helpers/deploy";

async function main () {
    const advancer = await deployContract("EpochAdvancer", [[
        "0xd432fab68b922972b104854fcd22211f33be6ec2",
        "0x1545c4ccda7de57b6c3c3609c1c8ad6f9c431ba4",
        "0xc7898e159c72ea4d79810582f945fb194b6841fc",
        "0x592df0ee9f8ab5958bf04de48254a37503da74e0",
    ], 400_000]);
    console.log(`Advancer deployed to: ${advancer.address}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
