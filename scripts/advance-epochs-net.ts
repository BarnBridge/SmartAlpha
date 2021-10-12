import hre from "hardhat";
import { EpochAdvancer, PoolFactory } from "../typechain";

const advancer = "0xa899Eeb62ada17e7C0A2799865Ec668111e81dd1";

const { ethers, deployments, getNamedAccounts } = hre;

(async () => {
    const advancer = await ethers.getContract("EpochAdvancer") as EpochAdvancer;

    const poolCount = await advancer.numberOfPools();
    const gasLimit = 400_004 * poolCount.toNumber();

    const tx = await advancer.advanceEpochs({ gasLimit });

    await tx.wait(1);
    console.log("Done", tx.hash);
})();
