import { ethers } from "hardhat";
import { expect } from "chai";
import { deployContract } from "./helpers/deploy";
import { AccountingModel, ERC20Mock, OracleMock, OwnableERC20, SeniorRateModel, SmartAlpha } from "../typechain";
import * as time from "./helpers/time";
import { Contract, ContractFactory, Signer } from "ethers";
import { zeroAddress } from "./helpers/helpers";

describe("SmartAlpha initialize", function () {
    let snapshotId: any;
    let sa: SmartAlpha;
    let poolToken: ERC20Mock;
    let juniorToken: OwnableERC20, seniorToken: OwnableERC20;
    let oracle: OracleMock, model: SeniorRateModel, accountingModel: AccountingModel;

    const epoch1Start: number = time.futureTimestamp(time.day);
    const epochDuration: number = 7 * time.day;

    let deployer: Signer, happyPirate: Signer, flyingParrot: Signer;
    let deployerAddress: string, happyPirateAddress: string, flyingParrotAddress: string;

    before(async function () {
        [deployer, happyPirate, flyingParrot] = await ethers.getSigners();
        deployerAddress = await deployer.getAddress();
        happyPirateAddress = await happyPirate.getAddress();
        flyingParrotAddress = await flyingParrot.getAddress();

        poolToken = (await deployContract("ERC20Mock", ["Mock", "MCK", 18])) as ERC20Mock;

        juniorToken = (await deployContract("OwnableERC20", ["junior token", "jToken", 18])) as OwnableERC20;
        seniorToken = (await deployContract("OwnableERC20", ["senior token", "sToken", 18])) as OwnableERC20;

        oracle = (await deployContract("OracleMock")) as OracleMock;
        model = (await deployContract("SeniorRateModel")) as SeniorRateModel;
        accountingModel = (await deployContract("AccountingModel")) as AccountingModel;

        sa = (await deployContract("SmartAlpha", [await deployer.getAddress(), flyingParrotAddress])) as SmartAlpha;
    });

    beforeEach(async function () {
        snapshotId = await ethers.provider.send("evm_snapshot", []);
    });

    afterEach(async function () {
        await ethers.provider.send("evm_revert", [snapshotId]);
    });

    describe("initialize", () => {
        it("fails if already initialized", async () => {
            await juniorToken.transferOwnership(sa.address);
            await seniorToken.transferOwnership(sa.address);

            await expect(sa.initialize(
                poolToken.address,
                oracle.address,
                model.address,
                accountingModel.address,
                juniorToken.address,
                seniorToken.address,
                epoch1Start,
                epochDuration,
            )).to.not.be.reverted;

            await expect(sa.initialize(
                poolToken.address,
                oracle.address,
                model.address,
                accountingModel.address,
                juniorToken.address,
                seniorToken.address,
                epoch1Start,
                epochDuration,
            )).to.be.revertedWith("contract already initialized");
        });

        it("fails if junior token is not owned by SA", async () => {
            await expect(sa.initialize(
                poolToken.address,
                oracle.address,
                model.address,
                accountingModel.address,
                juniorToken.address,
                seniorToken.address,
                epoch1Start,
                epochDuration,
            )).to.be.revertedWith("junior token owner must be SA");

            await juniorToken.transferOwnership(sa.address);

            await expect(sa.initialize(
                poolToken.address,
                oracle.address,
                model.address,
                accountingModel.address,
                juniorToken.address,
                seniorToken.address,
                epoch1Start,
                epochDuration,
            )).to.be.revertedWith("senior token owner must be SA");

            await seniorToken.transferOwnership(sa.address);

            await expect(sa.initialize(
                poolToken.address,
                oracle.address,
                model.address,
                accountingModel.address,
                juniorToken.address,
                seniorToken.address,
                epoch1Start,
                epochDuration,
            )).to.not.be.reverted;
        });

        it("fails if pool token is address(0)", async () => {
            await expect(sa.initialize(
                zeroAddress,
                oracle.address,
                model.address,
                accountingModel.address,
                juniorToken.address,
                seniorToken.address,
                epoch1Start,
                epochDuration,
            )).to.be.revertedWith("pool token can't be 0x0");
        });

        it("fails if junior token is address(0)", async () => {
            await expect(sa.initialize(
                poolToken.address,
                oracle.address,
                model.address,
                accountingModel.address,
                zeroAddress,
                seniorToken.address,
                epoch1Start,
                epochDuration,
            )).to.be.revertedWith("junior token can't be 0x0");
        });

        it("fails if senior token is address(0)", async () => {
            await expect(sa.initialize(
                poolToken.address,
                oracle.address,
                model.address,
                accountingModel.address,
                juniorToken.address,
                zeroAddress,
                epoch1Start,
                epochDuration,
            )).to.be.revertedWith("senior token can't be 0x0");
        });
    });

    describe("deploy", () => {
        it("fails if dao is address(0)", async () => {
            const factory: ContractFactory = await ethers.getContractFactory("SmartAlpha");

            await expect(factory.deploy(zeroAddress, deployerAddress))
                .to.be.revertedWith("invalid address");
        });

        it("fails if guardian is address(0)", async () => {
            const factory: ContractFactory = await ethers.getContractFactory("SmartAlpha");

            await expect(factory.deploy(deployerAddress, zeroAddress))
                .to.be.revertedWith("invalid address");
        });
    });
});
