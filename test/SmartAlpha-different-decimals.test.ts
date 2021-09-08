import { ethers } from "hardhat";
import { moveAtTimestamp, tenPow18, tenPow8 } from "./helpers/helpers";
import { deployContract } from "./helpers/deploy";
import { AccountingModel, ERC20Mock, OracleMock, OwnableERC20, SeniorRateModel, SmartAlpha } from "../typechain";
import * as time from "./helpers/time";
import { BigNumber, Signer } from "ethers";
import { expect } from "chai";

describe("SmartAlpha - different decimals", function () {
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

    describe("pool token, jtoken & stoken have 8 decimals", () => {
        it("mints the correct amount of tokens", async () => {
            await setupUser(happyPirate);
            await setupUser(flyingParrot);

            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).depositSenior(amount)).to.not.be.reverted;

            await moveAtEpoch(1);

            await expect(sa.connect(happyPirate).redeemJuniorTokens()).to.not.be.reverted;
            expect(await juniorToken.balanceOf(happyPirateAddress)).to.equal(amount);
            expect(await juniorToken.balanceOf(sa.address)).to.equal(0);

            await expect(sa.connect(flyingParrot).redeemSeniorTokens()).to.not.be.reverted;
            expect(await seniorToken.balanceOf(flyingParrotAddress)).to.equal(amount);
            expect(await seniorToken.balanceOf(sa.address)).to.equal(0);
        });

        it("calculates junior profits correctly", async () => {
            await setupUser(happyPirate);
            await setupUser(flyingParrot);

            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).depositSenior(amount)).to.not.be.reverted;

            await setPriceAndMoveAtEpoch(100, 1);

            await expect(sa.connect(happyPirate).redeemJuniorTokens()).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).redeemSeniorTokens()).to.not.be.reverted;

            await setPriceAndMoveAtEpoch(110, 2);

            expect((await sa.getEpochJuniorTokenPrice()).gte(tenPow18)).to.be.true;

            const stokenPrice = await sa.getEpochSeniorTokenPrice();
            expect(stokenPrice.gt(tenPow18.div(10)) && stokenPrice.lte(tenPow18)).to.be.true;
        });

        it("calculates senior profits correctly", async () => {
            await setupUser(happyPirate);
            await setupUser(flyingParrot);

            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).depositSenior(amount)).to.not.be.reverted;

            await setPriceAndMoveAtEpoch(100, 1);

            await expect(sa.connect(happyPirate).redeemJuniorTokens()).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).redeemSeniorTokens()).to.not.be.reverted;

            await setPriceAndMoveAtEpoch(90, 2);

            expect((await sa.getEpochSeniorTokenPrice()).gte(tenPow18)).to.be.true;

            const stokenPrice = await sa.getEpochJuniorTokenPrice();
            expect(stokenPrice.gt(tenPow18.div(10)) && stokenPrice.lte(tenPow18)).to.be.true;
        });

        it("calculates amount to withdraw correctly for junior", async () => {
            await setupUser(happyPirate);
            await setupUser(flyingParrot);

            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).depositSenior(amount)).to.not.be.reverted;

            await setPriceAndMoveAtEpoch(100, 1);

            await expect(sa.connect(happyPirate).redeemJuniorTokens()).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).redeemSeniorTokens()).to.not.be.reverted;

            await expect(sa.connect(happyPirate).exitJunior(amount)).to.not.be.reverted;

            // generate a profit for the junior that wants to exit
            await setPriceAndMoveAtEpoch(110, 2);

            await expect(sa.connect(happyPirate).redeemJuniorUnderlying()).to.not.be.reverted;

            const balanceAfter = await poolToken.balanceOf(happyPirateAddress);

            expect(balanceAfter.lte(amount.mul(2)));
        });

        it("calculates amount to withdraw correctly for senior", async () => {
            await setupUser(happyPirate);
            await setupUser(flyingParrot);

            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).depositSenior(amount)).to.not.be.reverted;

            await setPriceAndMoveAtEpoch(100, 1);

            await expect(sa.connect(happyPirate).redeemJuniorTokens()).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).redeemSeniorTokens()).to.not.be.reverted;

            await expect(sa.connect(flyingParrot).exitSenior(amount)).to.not.be.reverted;

            // generate a profit for the junior that wants to exit
            await setPriceAndMoveAtEpoch(90, 2);

            await expect(sa.connect(flyingParrot).redeemSeniorUnderlying()).to.not.be.reverted;

            const balanceAfter = await poolToken.balanceOf(flyingParrotAddress);
            expect(balanceAfter.lte(amount.mul(2)));
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
