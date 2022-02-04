import { ethers } from "hardhat";
import { deployContract } from "./helpers/deploy";
import { EpochAdvancer } from "../typechain";
import { expect } from "chai";
import { zeroAddress } from "./helpers/helpers";
import { ContractFactory, Signer } from "ethers";

describe("EpochAdvancer", () => {
    let snapshotId: any;

    let advancer: EpochAdvancer;
    let deployer: Signer, happyPirate: Signer;

    const someAddress = "0x0000000000000000000000000000000000000001";
    const someAddress2 = "0x0000000000000000000000000000000000000002";

    before(async function () {
        [deployer, happyPirate] = await ethers.getSigners();

        advancer = await deployContract("EpochAdvancer", [[]]) as EpochAdvancer;
    });

    beforeEach(async () => {
        snapshotId = await ethers.provider.send("evm_snapshot", []);
    });

    afterEach(async () => {
        await ethers.provider.send("evm_revert", [snapshotId]);
    });

    describe("getPrice()", () => {
        it("can be deployed", async () => {
            const factory: ContractFactory = await ethers.getContractFactory("EpochAdvancer");

            await expect(factory.deploy([]))
                .to.not.be.reverted;
        });

        it("can add pools as owner", async () => {
            await expect(advancer.connect(happyPirate).addPool(zeroAddress))
                .to.be.revertedWith("Ownable: caller is not the owner");

            await expect(advancer.connect(deployer).addPool(zeroAddress))
                .to.be.revertedWith("invalid address");

            await expect(advancer.connect(deployer).addPool(someAddress))
                .to.not.be.reverted;

            const pools = await advancer.getPools();
            expect(pools.length).to.eq(1);
            expect(pools[0]).to.eq(someAddress);
        });

        it("can remove pool as owner", async () => {
            await expect(advancer.connect(deployer).addPool(someAddress))
                .to.not.be.reverted;

            await expect(advancer.connect(happyPirate).removePool(someAddress))
                .to.be.revertedWith("Ownable: caller is not the owner");

            await expect(advancer.connect(deployer).removePool(zeroAddress))
                .to.be.revertedWith("invalid address");

            await expect(advancer.connect(deployer).removePool(someAddress))
                .to.not.be.reverted;

            let pools = await advancer.getPools();
            expect(pools.length).to.eq(0);

            await advancer.connect(deployer).addPools([someAddress, someAddress2]);
            pools = await advancer.getPools();
            expect(pools.length).to.eq(2);

            await expect(advancer.connect(deployer).removePool(someAddress)).to.not.be.reverted;

            pools = await advancer.getPools();
            expect(pools.length).to.eq(1);
            expect(pools[0]).to.eq(someAddress2);
        });
    });
});
