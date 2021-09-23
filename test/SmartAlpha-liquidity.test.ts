import { ethers } from "hardhat";
import { e8, moveAtTimestamp, tenPow18, tenPow8 } from "./helpers/helpers";
import { deployContract } from "./helpers/deploy";
import {
    AccountingModel,
    EpochAdvancer,
    ERC20Mock,
    OracleMock,
    OwnableERC20,
    SeniorRateModel,
    SmartAlpha,
} from "../typechain";
import * as time from "./helpers/time";
import { BigNumber, Signer } from "ethers";
import { expect } from "chai";
import { Bytes } from "ethers/lib/utils";

describe("SmartAlpha - liquidity", function () {
    let snapshotId: any;
    let sa: SmartAlpha;
    let poolToken: ERC20Mock;
    let juniorToken: OwnableERC20, seniorToken: OwnableERC20;
    let oracle: OracleMock, model: SeniorRateModel, accountingModel: AccountingModel;

    const epoch1Start: number = time.futureTimestamp(time.day);
    const epochDuration: number = 7 * time.day;
    const amount: BigNumber = BigNumber.from(100).mul(tenPow8);

    let deployer: Signer, happyPirate: Signer, flyingParrot: Signer;
    let deployerAddress: string, happyPirateAddress: string, flyingParrotAddress: string;

    before(async function () {
        [deployer, happyPirate, flyingParrot] = await ethers.getSigners();
        deployerAddress = await deployer.getAddress();
        happyPirateAddress = await happyPirate.getAddress();
        flyingParrotAddress = await flyingParrot.getAddress();

        poolToken = (await deployContract("ERC20Mock", ["Mock", "MCK", 8])) as ERC20Mock;
        juniorToken = (await deployContract("OwnableERC20", ["junior token", "jToken", 8])) as OwnableERC20;
        seniorToken = (await deployContract("OwnableERC20", ["senior token", "sToken", 8])) as OwnableERC20;

        oracle = (await deployContract("OracleMock")) as OracleMock;
        model = (await deployContract("SeniorRateModel")) as SeniorRateModel;
        accountingModel = (await deployContract("AccountingModel")) as AccountingModel;

        sa = (await deployContract("SmartAlpha", [await deployer.getAddress(), flyingParrotAddress])) as SmartAlpha;
        await juniorToken.transferOwnership(sa.address);
        await seniorToken.transferOwnership(sa.address);

        await sa.initialize(
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

    beforeEach(async function () {
        snapshotId = await ethers.provider.send("evm_snapshot", []);
    });

    afterEach(async function () {
        await ethers.provider.send("evm_revert", [snapshotId]);
    });

    describe("test low liquidity", () => {
        it("senior profits", async () => {
            const seniors = tenPow8.mul(100).toNumber();
            const juniors = 1;
            const startPrice = BigNumber.from(100);
            const endPrice = BigNumber.from(90);

            const [, down] = await model.getRates(juniors, seniors);

            const profits = await accountingModel.calcSeniorProfits(startPrice, endPrice, down, seniors, seniors + juniors);

            expect(profits.lt(juniors)).to.be.true;
        });

        it("junior profits", async () => {
            const seniors = 1;
            const juniors = tenPow8.mul(100).toNumber();
            const startPrice = BigNumber.from(100);
            const endPrice = BigNumber.from(110);

            const [up] = await model.getRates(juniors, seniors);

            const profits = await accountingModel.calcJuniorProfits(startPrice, endPrice, up, seniors, seniors + juniors);

            expect(profits.lt(seniors)).to.be.true;
        });

        it("zero juniors", async () => {
            const seniors = tenPow8.mul(100).toNumber();
            const juniors = 0;
            const startPrice = BigNumber.from(100);
            const endPrice = BigNumber.from(90);
            const endPriceUp = BigNumber.from(110);

            const [up, down] = await model.getRates(juniors, seniors);

            const profits = await accountingModel.calcSeniorProfits(startPrice, endPrice, down, seniors, seniors + juniors);

            expect(profits).to.equal(0);

            expect(up).to.equal(tenPow18);

            const juniorProfits = await accountingModel.calcJuniorProfits(startPrice, endPriceUp, up, seniors, seniors + juniors);
            expect(juniorProfits).to.equal(0);
        });
    });

    describe("epochs with 0 liquidity", () => {
        it("works with 0 juniors", async () => {
            await oracle.setPrice(e8(100));
            await setupSenior(happyPirate);

            await oracle.setPrice(e8(90));
            await moveAtEpoch(2);
            await expect(sa.advanceEpoch()).to.not.be.reverted;

            expect(await sa.epochSeniorLiquidity()).to.equal(amount);
        });

        it("works with 0 seniors", async () => {
            await oracle.setPrice(e8(100));
            await setupJunior(happyPirate);

            await oracle.setPrice(e8(110));
            await moveAtEpoch(2);

            await expect(sa.advanceEpoch()).to.not.be.reverted;

            expect(await sa.epochJuniorLiquidity()).to.equal(amount);
        });
    });

    describe("Epoch advancer", () => {
        it("works", async () => {
            const a = (await deployContract("EpochAdvancer", [[]])) as EpochAdvancer;

            await expect(a.addPool(sa.address)).to.not.be.reverted;
            expect(await a.numberOfPools()).to.equal(1);
            expect(await a.pools(0)).to.equal(sa.address);

            await moveAtEpoch(1);

            expect((await a.checkUpkeep("0x00"))[0]).to.be.true;

            await expect(a.advanceEpochs()).to.not.be.reverted;
            expect(await sa.epoch()).to.equal(1);
        });
    });

    async function setupUser (user: Signer, a = amount) {
        await poolToken.mint(await user.getAddress(), a);
        await poolToken.connect(user).approve(sa.address, a);
    }

    async function setupJunior (user: Signer) {
        await setupUser(user);
        await expect(sa.connect(user).depositJunior(amount)).to.not.be.reverted;

        await moveAtEpoch(1);

        await expect(sa.connect(user).redeemJuniorTokens())
            .to.not.be.reverted;
    }

    async function setupSenior (user: Signer) {
        await setupUser(user);
        await expect(sa.connect(user).depositSenior(amount)).to.not.be.reverted;

        await moveAtEpoch(1);

        await expect(sa.connect(user).redeemSeniorTokens())
            .to.not.be.reverted;
    }


    async function setPriceAndMoveAtEpoch (price: number, epoch: number) {
        await oracle.setPrice(price);
        await moveAtEpoch(epoch);
        await expect(sa.advanceEpoch()).to.not.be.reverted;
    }

    async function moveAtEpoch (epoch: number) {
        await moveAtTimestamp(epoch1Start + epochDuration * (epoch - 1));
    }
});
