import { ethers } from "hardhat";
import { deployContract } from "./helpers/deploy";
import { AccountingModel, ERC20Mock, OracleMock, OwnableERC20, SeniorRateModel, SmartAlpha } from "../typechain";
import { BigNumber, Signer } from "ethers";
import { expect } from "chai";
import * as time from "./helpers/time";
import { tenPow18, zeroAddress } from "./helpers/helpers";

describe("Governance", () => {
    let snapshotId: any;
    let sa: SmartAlpha;

    let deployer: Signer, happyPirate: Signer, flyingParrot: Signer;
    let deployerAddress: string, happyPirateAddress: string, flyingParrotAddress: string;

    const epoch1Start: number = time.futureTimestamp(time.day);
    const epochDuration: number = 7 * time.day;
    const feesPercentage: BigNumber = tenPow18.mul(5).div(10).div(100);

    before(async function () {
        [deployer, happyPirate, flyingParrot] = await ethers.getSigners();
        deployerAddress = await deployer.getAddress();
        happyPirateAddress = await happyPirate.getAddress();
        flyingParrotAddress = await flyingParrot.getAddress();

        const poolToken = (await deployContract("ERC20Mock", ["Mock", "MCK", 18])) as ERC20Mock;

        const juniorToken = (await deployContract("OwnableERC20", ["junior token", "jToken", 18])) as OwnableERC20;
        const seniorToken = (await deployContract("OwnableERC20", ["senior token", "sToken", 18])) as OwnableERC20;

        const oracle = (await deployContract("OracleMock")) as OracleMock;
        const model = (await deployContract("SeniorRateModel")) as SeniorRateModel;
        const accountingModel = (await deployContract("AccountingModel")) as AccountingModel;

        sa = (await deployContract("SmartAlpha", [happyPirateAddress, flyingParrotAddress])) as SmartAlpha;

        await juniorToken.transferOwnership(sa.address);
        await seniorToken.transferOwnership(sa.address);

        await sa.connect(happyPirate)
            .initialize(
                poolToken.address,
                oracle.address,
                model.address,
                accountingModel.address,
                juniorToken.address,
                seniorToken.address,
                epoch1Start,
                epochDuration,
            );
    });

    beforeEach(async () => {
        snapshotId = await ethers.provider.send("evm_snapshot", []);
    });

    afterEach(async () => {
        await ethers.provider.send("evm_revert", [snapshotId]);
    });

    describe("General tests", () => {
        it("should be deployed", async () => {
            expect(sa.address).to.not.equal(0);
        });

        it("sets dao and guardian correctly", async () => {
            expect(await sa.dao()).to.equal(happyPirateAddress);
            expect(await sa.guardian()).to.equal(flyingParrotAddress);
        });
    });

    describe("transferDAO", () => {
        it("fails if unauthorised", async () => {
            await expect(sa.connect(deployer).transferDAO(deployerAddress))
                .to.be.revertedWith("!dao");
            await expect(sa.connect(flyingParrot).transferDAO(flyingParrotAddress))
                .to.be.revertedWith("!dao");
            await expect(sa.connect(flyingParrot).transferDAO(deployerAddress))
                .to.be.revertedWith("!dao");
        });

        it("fails if address(0) is passed", async () => {
            await expect(sa.connect(happyPirate).transferDAO(zeroAddress))
                .to.be.revertedWith("invalid address");
        });

        it("fails if same dao", async () => {
            await expect(sa.connect(happyPirate).transferDAO(happyPirateAddress))
                .to.be.revertedWith("!new");
        });

        it("can change dao", async () => {
            await expect(sa.connect(happyPirate).transferDAO(deployerAddress))
                .to.not.be.reverted;
        });
    });

    describe("transferGuardian", () => {
        it("fails if unauthorised", async () => {
            await expect(sa.connect(deployer).transferGuardian(deployerAddress))
                .to.be.revertedWith("!guardian");
            await expect(sa.connect(deployer).transferGuardian(flyingParrotAddress))
                .to.be.revertedWith("!guardian");
        });

        it("fails if address(0) is passed", async () => {
            await expect(sa.connect(happyPirate).transferGuardian(zeroAddress))
                .to.be.revertedWith("invalid address");
        });

        it("fails if same guardian", async () => {
            await expect(sa.connect(happyPirate).transferGuardian(flyingParrotAddress))
                .to.be.revertedWith("!new");
        });

        it("dao can change guardian", async () => {
            await expect(sa.connect(happyPirate).transferGuardian(deployerAddress))
                .to.not.be.reverted;
        });

        it("guardian can change guardian", async () => {
            await expect(sa.connect(flyingParrot).transferGuardian(deployerAddress))
                .to.not.be.reverted;
        });
    });

    describe("pause", async () => {
        it("fails if unauthorised", async () => {
            await expect(sa.connect(deployer).pauseSystem())
                .to.be.revertedWith("!guardian");
        });

        it("works if called by dao", async () => {
            await expect(sa.connect(happyPirate).pauseSystem())
                .to.not.be.reverted;
            expect(await sa.paused()).to.equal(true);
        });

        it("works if called by guardian", async () => {
            await expect(sa.connect(flyingParrot).pauseSystem())
                .to.not.be.reverted;
            expect(await sa.paused()).to.equal(true);
        });

        it("reverts if already paused", async () => {
            await expect(sa.connect(happyPirate).pauseSystem())
                .to.not.be.reverted;

            await expect(sa.connect(happyPirate).pauseSystem())
                .to.be.revertedWith("paused");
        });

        it("does not allow deposits if system is paused", async () => {
            await expect(sa.connect(happyPirate).pauseSystem()).to.not.be.reverted;

            await expect(sa.connect(happyPirate).depositJunior(1))
                .to.be.revertedWith("paused");

            await expect(sa.connect(happyPirate).depositSenior(1))
                .to.be.revertedWith("paused");
        });

        it("resume reverts if unauthorised", async () => {
            await expect(sa.connect(happyPirate).pauseSystem()).to.not.be.reverted;

            await expect(sa.connect(deployer).resumeSystem()).to.be.revertedWith("!guardian");
        });

        it("resume reverts if not paused", async () => {
            await expect(sa.connect(happyPirate).resumeSystem()).to.be.revertedWith("!paused");
        });

        it("can be resumed by dao", async () => {
            await expect(sa.connect(happyPirate).pauseSystem()).to.not.be.reverted;

            await expect(sa.connect(happyPirate).resumeSystem()).to.not.be.reverted;
        });

        it("can be resumed by guardian", async () => {
            await expect(sa.connect(happyPirate).pauseSystem()).to.not.be.reverted;

            await expect(sa.connect(flyingParrot).resumeSystem()).to.not.be.reverted;
        });

        it("allows deposits after resume", async () => {
            await expect(sa.connect(happyPirate).pauseSystem()).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).resumeSystem()).to.not.be.reverted;

            await expect(sa.connect(deployer).depositJunior(1)).to.not.be.revertedWith("paused");
            await expect(sa.connect(deployer).depositSenior(1)).to.not.be.revertedWith("paused");
        });
    });

    describe("setPriceOracle", async () => {
        it("reverts if not called by dao", async () => {
            await expect(sa.connect(deployer).setPriceOracle(happyPirateAddress))
                .to.be.revertedWith("!dao");
            await expect(sa.connect(flyingParrot).setPriceOracle(happyPirateAddress))
                .to.be.revertedWith("!dao");
        });

        it("reverts if address does not have code", async () => {
            await expect(sa.connect(happyPirate).setPriceOracle(happyPirateAddress))
                .to.be.revertedWith("invalid address");

            await expect(sa.connect(happyPirate).setPriceOracle(zeroAddress))
                .to.be.revertedWith("invalid address");
        });

        it("works if called by dao", async () => {
            const oracle = await deployContract("OracleMock");

            await expect(sa.connect(happyPirate).setPriceOracle(oracle.address))
                .to.not.be.reverted;
        });
    });

    describe("setSeniorRateModel", async () => {
        it("reverts if not called by dao", async () => {
            await expect(sa.connect(deployer).setSeniorRateModel(happyPirateAddress))
                .to.be.revertedWith("!dao");
            await expect(sa.connect(flyingParrot).setSeniorRateModel(happyPirateAddress))
                .to.be.revertedWith("!dao");
        });

        it("reverts if address does not have code", async () => {
            await expect(sa.connect(happyPirate).setSeniorRateModel(happyPirateAddress))
                .to.be.revertedWith("invalid address");

            await expect(sa.connect(happyPirate).setSeniorRateModel(zeroAddress))
                .to.be.revertedWith("invalid address");
        });

        it("works if called by dao", async () => {
            const model = await deployContract("SeniorRateModel");

            await expect(sa.connect(happyPirate).setSeniorRateModel(model.address))
                .to.not.be.reverted;
        });
    });

    describe("setFeesOwner", async () => {
        it("reverts if not called by dao", async () => {
            await expect(sa.connect(deployer).setFeesOwner(happyPirateAddress))
                .to.be.revertedWith("!dao");
            await expect(sa.connect(flyingParrot).setFeesOwner(happyPirateAddress))
                .to.be.revertedWith("!dao");
        });

        it("reverts if called with 0 address", async () => {
            await expect(sa.connect(happyPirate).setFeesOwner(zeroAddress))
                .to.be.revertedWith("invalid address");
        });

        it("works if called by dao", async () => {
            await expect(sa.connect(happyPirate).setFeesOwner(happyPirateAddress))
                .to.not.be.reverted;

            expect(await sa.feesOwner()).to.equal(happyPirateAddress);
        });
    });

    describe("setFeesPercentage", async () => {
        it("reverts if not called by dao", async () => {
            await expect(sa.connect(deployer).setFeesPercentage(feesPercentage))
                .to.be.revertedWith("!dao");
            await expect(sa.connect(flyingParrot).setFeesPercentage(feesPercentage))
                .to.be.revertedWith("!dao");
        });

        it("reverts if no owner is set", async () => {
            await expect(sa.connect(happyPirate).setFeesPercentage(feesPercentage))
                .to.be.revertedWith("no fees owner");

            await expect(sa.connect(happyPirate).setFeesPercentage(0))
                .to.not.be.reverted;
        });

        it("reverts if fee percentage is more than max", async () => {
            await expect(sa.connect(happyPirate).setFeesOwner(happyPirateAddress))
                .to.not.be.reverted;
            await expect(sa.connect(happyPirate).setFeesPercentage(tenPow18.add(1)))
                .to.be.revertedWith("max percentage exceeded");
        });

        it("works if conditions are met", async () => {
            await expect(sa.connect(happyPirate).setFeesOwner(happyPirateAddress))
                .to.not.be.reverted;
            await expect(sa.connect(happyPirate).setFeesPercentage(feesPercentage))
                .to.not.be.reverted;

            expect(await sa.feesPercentage()).to.equal(feesPercentage);
        });
    });
});
