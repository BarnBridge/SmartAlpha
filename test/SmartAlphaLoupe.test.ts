import { ethers } from "hardhat";
import { e18, e8, moveAtTimestamp, tenPow8 } from "./helpers/helpers";
import { deployContract } from "./helpers/deploy";
import {
    AccountingModel,
    ERC20Mock,
    OracleMock,
    OwnableERC20,
    SeniorRateModel,
    SmartAlpha,
    SmartAlphaLoupe,
} from "../typechain";
import * as time from "./helpers/time";
import { BigNumber, Signer } from "ethers";
import { expect } from "chai";

describe("SmartAlphaLoupe", function () {
    let snapshotId: any;
    let sa: SmartAlpha;
    let poolToken: ERC20Mock;
    let juniorToken: OwnableERC20, seniorToken: OwnableERC20;
    let oracle: OracleMock, model: SeniorRateModel, accountingModel: AccountingModel;
    let loupe: SmartAlphaLoupe;

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
        loupe = (await deployContract("SmartAlphaLoupe")) as SmartAlphaLoupe;

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

    describe("loupe", () => {
        it("returns user's redeemable junior tokens", async () => {
            await setupUser(happyPirate);
            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;

            expect(await loupe.callStatic.userRedeemableJuniorTokens(sa.address, happyPirateAddress)).to.equal(0);

            await moveAtEpoch(1);

            expect(await loupe.callStatic.userRedeemableJuniorTokens(sa.address, happyPirateAddress)).to.equal(amount);
        });

        it("returns user's redeemable senior tokens", async () => {
            await setupUser(happyPirate);
            await expect(sa.connect(happyPirate).depositSenior(amount)).to.not.be.reverted;

            expect(await loupe.callStatic.userRedeemableSeniorTokens(sa.address, happyPirateAddress)).to.equal(0);

            await moveAtEpoch(1);

            expect(await loupe.callStatic.userRedeemableSeniorTokens(sa.address, happyPirateAddress)).to.equal(amount);
        });

        it("returns user's redeemable junior underlying", async () => {
            await setupJunior(happyPirate);

            await expect(sa.connect(happyPirate).exitJunior(amount)).to.not.be.reverted;

            expect(await loupe.callStatic.userRedeemableJuniorUnderlying(sa.address, happyPirateAddress)).to.equal(0);

            await moveAtEpoch(2);

            expect(await loupe.callStatic.userRedeemableJuniorUnderlying(sa.address, happyPirateAddress)).to.equal(amount);
        });

        it("returns user's redeemable senior underlying", async () => {
            await setupSenior(happyPirate);

            await expect(sa.connect(happyPirate).exitSenior(amount)).to.not.be.reverted;

            expect(await loupe.callStatic.userRedeemableSeniorUnderlying(sa.address, happyPirateAddress)).to.equal(0);

            await moveAtEpoch(2);

            expect(await loupe.callStatic.userRedeemableSeniorUnderlying(sa.address, happyPirateAddress)).to.equal(amount);
        });

        it("returns estimate next epoch", async () => {
            await setupUser(happyPirate);
            await setupUser(flyingParrot);

            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).depositSenior(amount)).to.not.be.reverted;

            await oracle.setPrice(e8(1));

            let estimated = await loupe.estimateNextEpoch(sa.address);

            expect(estimated.juniorLiquidity).to.equal(amount);
            expect(estimated.seniorLiquidity).to.equal(amount);
            expect(estimated.startPrice).to.equal(e8(1));
            expect(estimated.downsideRate).to.equal(e18(35).div(100));
            expect(estimated.upsideRate).to.equal("307142857142857142");

            await moveAtEpoch(1);

            estimated = await loupe.estimateNextEpoch(sa.address);
            expect(estimated.juniorLiquidity).to.equal(amount);
            expect(estimated.seniorLiquidity).to.equal(amount);
            expect(estimated.startPrice).to.equal(e8(1));

            await setupUser(happyPirate);
            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;

            estimated = await loupe.estimateNextEpoch(sa.address);
            expect(estimated.juniorLiquidity).to.equal(amount.mul(2));

            // the junior dominance is now 66.66% which would result in a bigger upside rate
            expect(estimated.upsideRate).to.equal("354761904761904761");

            // price increases with 100%
            await oracle.setPrice(e8(2));

            estimated = await loupe.estimateNextEpoch(sa.address);
            expect(estimated.startPrice).to.equal(e8(2));

            expect(estimated.juniorLiquidity.gt(amount.mul(2))).to.be.true;
            expect(estimated.seniorLiquidity.lt(amount)).to.be.true;
        });

        it("returns user positions", async () => {
            await setupUser(happyPirate);
            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;

            await setupUser(happyPirate);
            await expect(sa.connect(happyPirate).depositSenior(amount)).to.not.be.reverted;

            await oracle.setPrice(e8(1));

            let positions = await loupe.callStatic.userPositions([sa.address], happyPirateAddress);
            let pos = positions[0];

            expect(pos.pool).to.equal(sa.address);
            expect(pos.juniorTokenBalance).to.equal(0);
            expect(pos.seniorTokenBalance).to.equal(0);
            expect(pos.estimatedJuniorTokenPrice).to.equal(e18(1));
            expect(pos.estimatedSeniorTokenPrice).to.equal(e18(1));
            expect(pos.poolTokenPriceInQuoteAsset).to.equal(e8(1));
            expect(pos.redeemableJuniorTokens).to.equal(0);
            expect(pos.redeemableSeniorTokens).to.equal(0);
            expect(pos.redeemableJuniorUnderlying).to.equal(0);
            expect(pos.redeemableSeniorUnderlying).to.equal(0);
            expect(pos.juniorEntryQueue.epoch).to.equal(0);
            expect(pos.juniorEntryQueue.amount).to.equal(amount);
            expect(pos.seniorEntryQueue.epoch).to.equal(0);
            expect(pos.seniorEntryQueue.amount).to.equal(amount);
            expect(pos.juniorExitQueue.epoch).to.equal(0);
            expect(pos.juniorExitQueue.amount).to.equal(0);
            expect(pos.seniorExitQueue.epoch).to.equal(0);
            expect(pos.seniorExitQueue.amount).to.equal(0);

            expect(pos.enteringJuniorUnderlying).to.equal(amount);
            expect(pos.enteringSeniorUnderlying).to.equal(amount);

            await moveAtEpoch(1);

            positions = await loupe.callStatic.userPositions([sa.address], happyPirateAddress);
            pos = positions[0];

            expect(pos.redeemableJuniorTokens).to.equal(amount);
            expect(pos.enteringJuniorUnderlying).to.equal(0);
            expect(pos.redeemableSeniorTokens).to.equal(amount);
            expect(pos.enteringSeniorUnderlying).to.equal(0);

            // redeem junior tokens
            await expect(sa.connect(happyPirate).redeemJuniorTokens()).to.not.be.reverted;

            positions = await loupe.callStatic.userPositions([sa.address], happyPirateAddress);
            pos = positions[0];

            expect(pos.juniorTokenBalance).to.equal(amount);
            expect(pos.redeemableJuniorTokens).to.equal(0);
            expect(pos.juniorEntryQueue.amount).to.equal(0);

            // redeem senior position
            await expect(sa.connect(happyPirate).redeemSeniorTokens()).to.not.be.reverted;

            positions = await loupe.callStatic.userPositions([sa.address], happyPirateAddress);
            pos = positions[0];

            expect(pos.seniorTokenBalance).to.equal(amount);
            expect(pos.redeemableSeniorTokens).to.equal(0);
            expect(pos.seniorEntryQueue.amount).to.equal(0);

            // change token price
            await oracle.setPrice(e8(2));

            positions = await loupe.callStatic.userPositions([sa.address], happyPirateAddress);
            pos = positions[0];

            expect(pos.poolTokenPriceInQuoteAsset).to.equal(e8(2));
            expect(pos.estimatedJuniorTokenPrice).to.not.equal(e18(1));
            expect(pos.estimatedSeniorTokenPrice).to.not.equal(e18(1));

            // exit position
            await expect(sa.connect(happyPirate).exitJunior(amount)).to.not.be.reverted;

            positions = await loupe.callStatic.userPositions([sa.address], happyPirateAddress);
            pos = positions[0];

            expect(pos.juniorTokenBalance).to.equal(0);
            expect(pos.juniorExitQueue.amount).to.equal(amount);
            expect(pos.juniorExitQueue.epoch).to.equal(1);
            expect(pos.exitingJuniorTokens).to.equal(amount);

            // exit senior position
            await expect(sa.connect(happyPirate).exitSenior(amount)).to.not.be.reverted;

            positions = await loupe.callStatic.userPositions([sa.address], happyPirateAddress);
            pos = positions[0];

            expect(pos.seniorTokenBalance).to.equal(0);
            expect(pos.seniorExitQueue.amount).to.equal(amount);
            expect(pos.seniorExitQueue.epoch).to.equal(1);
            expect(pos.exitingSeniorTokens).to.equal(amount);

            // move at next epoch
            await moveAtEpoch(2);

            positions = await loupe.callStatic.userPositions([sa.address], happyPirateAddress);
            pos = positions[0];

            expect(pos.redeemableJuniorUnderlying).to.not.equal(0);
            expect(pos.exitingJuniorTokens).to.equal(0);
            expect(pos.redeemableSeniorUnderlying).to.not.equal(0);
            expect(pos.exitingSeniorTokens).to.equal(0);
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
