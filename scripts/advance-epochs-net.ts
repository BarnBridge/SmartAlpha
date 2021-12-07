import hre from "hardhat";
import { EpochAdvancer } from "../typechain";

const { ethers } = hre;

(async () => {
    const advancer = await ethers.getContract("EpochAdvancer") as EpochAdvancer;

    const poolCount = await advancer.numberOfPools();
    const gasLimit = 400_004 * poolCount.toNumber();

    const tx = await advancer.advanceEpochs({ gasLimit: gasLimit });

    await tx.wait(1);
    console.log("Done", tx.hash);
})();
