import { contractAt } from "../test/helpers/helpers";
import { EpochAdvancer } from "../typechain";

const advancer = "0xa899Eeb62ada17e7C0A2799865Ec668111e81dd1";

async function main () {
    const a = (await contractAt("EpochAdvancer", advancer)) as EpochAdvancer;

    const tx = await a.advanceEpochs();
    await tx.wait(1);

    console.log("Done");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
