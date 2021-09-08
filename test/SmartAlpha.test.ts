import { ethers } from "hardhat";
import { expect } from "chai";
import { moveAtTimestamp, tenPow18, tenPow8, zeroAddress } from "./helpers/helpers";
import { deployContract } from "./helpers/deploy";
import { AccountingModel, ERC20Mock, OracleMock, OwnableERC20, SeniorRateModel, SmartAlpha } from "../typechain";
import * as time from "./helpers/time";
import { BigNumber, Signer } from "ethers";
import { expectEqualWithDust } from "./helpers/assertions";
import { calcJuniorProfits, calcSeniorProfits } from "./helpers/smartalpha";

describe("SmartAlpha", function () {
    let snapshotId: any;
    let sa: SmartAlpha;
    let poolToken: ERC20Mock;
    let juniorToken: OwnableERC20, seniorToken: OwnableERC20;
    let oracle: OracleMock, model: SeniorRateModel, accountingModel: AccountingModel;

    const epoch1Start: number = time.futureTimestamp(time.day);
    const epochDuration: number = 7 * time.day;
    const amount: BigNumber = BigNumber.from(100).mul(tenPow18);
    const feesPercentage: BigNumber = tenPow18.mul(5).div(10).div(100);

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

    describe("General tests", () => {
        it("should be deployed", async () => {
            expect(sa.address).to.not.equal(0);
        });
    });

    describe("getCurrentEpoch", () => {
        it("returns correct epoch", async () => {
            expect(await sa.getCurrentEpoch()).to.equal(0);

            await moveAtTimestamp(time.futureTimestamp(time.day + 1));

            expect(await sa.getCurrentEpoch()).to.equal(1);

            await moveAtTimestamp(time.futureTimestamp(8 * time.day));

            expect(await sa.getCurrentEpoch()).to.equal(2);
        });
    });

    describe("advance epoch", async () => {
        it("does nothing if stored epoch is equal to current epoch", async () => {
            expect(await sa.epoch()).to.equal(0);
            expect(await sa.getCurrentEpoch()).to.equal(0);

            await oracle.setPrice(amount);
            await expect(sa.advanceEpoch()).to.not.be.reverted;

            expect(await sa.epoch()).to.equal(0);
            expect(await sa.epochEntryPrice()).to.equal(0);
        });

        it("updates the state correctly", async () => {
            await moveAtEpoch(1);
            await oracle.setPrice(amount);

            await setupUser(happyPirate);
            await setupUser(flyingParrot);

            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).depositSenior(amount)).to.not.be.reverted;

            expect(await sa.getCurrentEpoch()).to.equal(1);

            await moveAtEpoch(2);
            await expect(sa.advanceEpoch()).to.not.be.reverted;

            expect(await sa.epoch()).to.equal(2);
            expect(await sa.epochEntryPrice()).to.equal(amount);
            expect(await sa.history_epochJuniorTokenPrice(1)).to.equal(tenPow18);
            expect(await sa.history_epochSeniorTokenPrice(1)).to.equal(tenPow18);
            expect(await sa.queuedJuniorsUnderlyingIn()).to.equal(0);
            expect(await sa.queuedSeniorsUnderlyingIn()).to.equal(0);
            expect(await juniorToken.balanceOf(sa.address)).to.equal(amount);
            expect(await seniorToken.balanceOf(sa.address)).to.equal(amount);
        });
    });

    describe("junior deposit", () => {
        it("reverts if amount is 0", async () => {
            await expect(sa.connect(happyPirate).depositJunior(0))
                .to.be.revertedWith("amount must be greater than 0");
        });

        it("reverts if user did not approve token", async () => {
            await expect(sa.connect(happyPirate).depositJunior(amount))
                .to.be.revertedWith("not enough allowance");
        });

        it("increases the total queued junior amount in", async () => {
            await setupUser(happyPirate);

            await expect(sa.connect(happyPirate).depositJunior(amount))
                .to.not.be.reverted;

            expect(await sa.queuedJuniorsUnderlyingIn()).to.equal(amount);
            expect(await sa.epochBalance()).to.equal(0);
        });

        it("saves user's position to state", async () => {
            await setupUser(happyPirate);

            await expect(sa.connect(happyPirate).depositJunior(amount))
                .to.not.be.reverted;

            const epoch = await sa.epoch();

            const pos = await sa.juniorEntryQueue(happyPirateAddress);
            expect(pos.epoch).to.equal(epoch);
            expect(pos.amount).to.equal(amount);
        });

        it("transfers the underlying to itself", async () => {
            await setupUser(happyPirate);

            await expect(sa.connect(happyPirate).depositJunior(amount))
                .to.not.be.reverted;

            expect(await poolToken.balanceOf(sa.address)).to.equal(amount);
            expect(await poolToken.balanceOf(happyPirateAddress)).to.equal(0);
        });

        it("does not transfer junior tokens to user yet", async () => {
            await setupUser(happyPirate);

            await expect(sa.connect(happyPirate).depositJunior(amount))
                .to.not.be.reverted;

            expect(await juniorToken.balanceOf(happyPirateAddress)).to.equal(0);
        });

        it("automatically redeems junior tokens if there's an old position", async () => {
            await setupUser(happyPirate, amount.mul(2));

            await expect(sa.connect(happyPirate).depositJunior(amount))
                .to.not.be.reverted;

            await moveAtEpoch(1);

            await expect(sa.connect(happyPirate).depositJunior(amount))
                .to.not.be.reverted;

            expect(await juniorToken.balanceOf(happyPirateAddress)).to.equal(amount);
            expect(await juniorToken.balanceOf(sa.address)).to.equal(0);

            const pos = await sa.juniorEntryQueue(happyPirateAddress);
            expect(pos.epoch).to.equal(1);
            expect(pos.amount).to.equal(amount);
        });

        it("increases balance when called multiple times in same epoch", async () => {
            await setupUser(happyPirate, amount.mul(2));

            await expect(sa.connect(happyPirate).depositJunior(amount))
                .to.not.be.reverted;

            let pos = await sa.juniorEntryQueue(happyPirateAddress);
            expect(pos.epoch).to.equal(0);
            expect(pos.amount).to.equal(amount);

            await expect(sa.connect(happyPirate).depositJunior(amount))
                .to.not.be.reverted;

            pos = await sa.juniorEntryQueue(happyPirateAddress);
            expect(pos.epoch).to.equal(0);
            expect(pos.amount).to.equal(amount.mul(2));
        });
    });

    describe("junior deposit 2nd step (redeem)", () => {
        it("does not allow redeeming for future epoch", async () => {
            await expect(sa.redeemJuniorTokens())
                .to.be.revertedWith("not redeemable yet");
        });

        it("reverts if user nothing to redeem in the queue for the selected epoch", async () => {
            await moveAtEpoch(1);

            const epoch = await sa.getCurrentEpoch();
            expect(epoch).to.equal(1);

            await expect(sa.redeemJuniorTokens())
                .to.be.revertedWith("nothing to redeem");
        });

        it("updates user's participation to 0 and transfers junior tokens", async () => {
            await setupUser(happyPirate);

            await expect(sa.connect(happyPirate).depositJunior(amount))
                .to.not.be.reverted;

            await setPriceAndMoveAtEpoch(100, 1);

            await expect(sa.connect(happyPirate).redeemJuniorTokens())
                .to.not.be.reverted;

            const pos = await sa.juniorEntryQueue(happyPirateAddress);
            expect(pos.amount).to.equal(0);

            expect(await juniorToken.balanceOf(happyPirateAddress)).to.equal(amount);
            expect(await juniorToken.balanceOf(sa.address)).to.equal(0);
        });
    });

    describe("senior deposit (1st step)", async () => {
        it("reverts if amount is 0", async () => {
            await expect(sa.connect(happyPirate).depositSenior(0))
                .to.be.revertedWith("amount must be greater than 0");
        });

        it("reverts if user did not approve token", async () => {
            await poolToken.mint(happyPirateAddress, amount);
            await expect(sa.connect(happyPirate).depositSenior(amount))
                .to.be.revertedWith("not enough allowance");
        });

        it("updates the senior queued amount in", async () => {
            await setupUser(happyPirate);

            await expect(sa.connect(happyPirate).depositSenior(amount))
                .to.not.be.reverted;

            expect(await sa.queuedSeniorsUnderlyingIn()).to.equal(amount);

            const pos = await sa.seniorEntryQueue(happyPirateAddress);
            expect(pos.amount).to.equal(amount);
            expect(pos.epoch).to.equal(0);
        });

        it("transfers the amount of pool token from user to pool", async () => {
            await setupUser(happyPirate);

            await expect(sa.connect(happyPirate).depositSenior(amount))
                .to.not.be.reverted;

            expect(await poolToken.balanceOf(happyPirateAddress)).to.equal(0);
            expect(await poolToken.balanceOf(sa.address)).to.equal(amount);
        });

        it("does not modify the senior token supply", async () => {
            await setupUser(happyPirate);

            const supply = await seniorToken.totalSupply();

            await expect(sa.connect(happyPirate).depositSenior(amount))
                .to.not.be.reverted;

            expect(await seniorToken.totalSupply()).to.equal(supply);

            expect(await seniorToken.balanceOf(happyPirateAddress)).to.equal(0);
        });

        it("automatically redeems senior tokens if there's an old position", async () => {
            await setupUser(happyPirate, amount.mul(2));

            await expect(sa.connect(happyPirate).depositSenior(amount))
                .to.not.be.reverted;

            await moveAtEpoch(1);

            await expect(sa.connect(happyPirate).depositSenior(amount))
                .to.not.be.reverted;

            expect(await seniorToken.balanceOf(happyPirateAddress)).to.equal(amount);
            expect(await seniorToken.balanceOf(sa.address)).to.equal(0);

            const pos = await sa.seniorEntryQueue(happyPirateAddress);
            expect(pos.epoch).to.equal(1);
            expect(pos.amount).to.equal(amount);
        });

        it("increases balance when called multiple times in same epoch", async () => {
            await setupUser(happyPirate, amount.mul(2));

            await expect(sa.connect(happyPirate).depositSenior(amount))
                .to.not.be.reverted;

            let pos = await sa.seniorEntryQueue(happyPirateAddress);
            expect(pos.epoch).to.equal(0);
            expect(pos.amount).to.equal(amount);

            await expect(sa.connect(happyPirate).depositSenior(amount))
                .to.not.be.reverted;

            pos = await sa.seniorEntryQueue(happyPirateAddress);
            expect(pos.epoch).to.equal(0);
            expect(pos.amount).to.equal(amount.mul(2));
        });
    });

    describe("senior deposit (2nd step)", async () => {
        it("does not allow redeeming for future epoch", async () => {
            await expect(sa.redeemSeniorTokens())
                .to.be.revertedWith("not redeemable yet");
        });

        it("reverts if user nothing to redeem in the queue for the selected epoch", async () => {
            await moveAtEpoch(1);

            const epoch = await sa.getCurrentEpoch();
            expect(epoch).to.equal(1);

            await expect(sa.redeemSeniorTokens())
                .to.be.revertedWith("nothing to redeem");
        });

        it("updates user's participation to 0 and transfers senior tokens", async () => {
            await setupUser(happyPirate);

            await expect(sa.connect(happyPirate).depositSenior(amount))
                .to.not.be.reverted;

            await setPriceAndMoveAtEpoch(100, 1);

            await expect(sa.connect(happyPirate).redeemSeniorTokens())
                .to.not.be.reverted;

            const pos = await sa.seniorEntryQueue(happyPirateAddress);

            expect(pos.amount).to.equal(0);
            expect(await seniorToken.balanceOf(happyPirateAddress)).to.equal(amount);
            expect(await seniorToken.balanceOf(sa.address)).to.equal(0);
        });
    });

    describe("junior exit (1st step)", () => {
        it("reverts if user does not enough junior token balance", async () => {
            await expect(sa.exitJunior(amount))
                .to.be.revertedWith("not enough balance");
        });

        it("updates the state accordingly", async () => {
            // setup for exit
            await setupJunior(happyPirate);

            const balance = await sa.epochBalance();
            expect(balance).to.not.equal(0);

            // exit and assertions
            await expect(sa.connect(happyPirate).exitJunior(amount)).to.not.be.reverted;

            // user should be added to the queue but the parameters for the current epoch
            // should not change;
            // the junior tokens should be transferred from user to the pool
            const pos = await sa.juniorExitQueue(happyPirateAddress);
            expect(pos.epoch).to.equal(1);
            expect(pos.amount).to.equal(amount);
            expect(await juniorToken.balanceOf(happyPirateAddress)).to.equal(0);
            expect(await juniorToken.balanceOf(sa.address)).to.equal(amount);
            expect(await sa.epochBalance()).to.equal(balance);

            // the junior liquidity should not be modified until the end of the epoch
            expect(await sa.epochJuniorLiquidity()).to.equal(amount);

            // moving to the next epoch, the previously queued junior should be materialized
            // into the pool parameters, in this case leaving the total balance and junior
            // liquidity at 0
            await moveAtEpoch(2);
            await expect(sa.advanceEpoch()).to.not.be.reverted;
            expect(await sa.epochBalance()).to.equal(0);
            expect(await sa.epochJuniorLiquidity()).to.equal(0);
        });

        it("automatically redeems junior underlying if there's an old position", async () => {
            await setupUser(happyPirate, amount.mul(2));

            await expect(sa.connect(happyPirate).depositJunior(amount.mul(2)))
                .to.not.be.reverted;

            await moveAtEpoch(1);

            await expect(sa.connect(happyPirate).redeemJuniorTokens()).to.not.be.reverted;

            await expect(sa.connect(happyPirate).exitJunior(amount)).to.not.be.reverted;
            let pos = await sa.juniorExitQueue(happyPirateAddress);
            expect(pos.epoch).to.equal(1);
            expect(pos.amount).to.equal(amount);

            await moveAtEpoch(2);

            await expect(sa.connect(happyPirate).exitJunior(amount)).to.not.be.reverted;

            expect(await poolToken.balanceOf(happyPirateAddress)).to.equal(amount);

            pos = await sa.juniorExitQueue(happyPirateAddress);
            expect(pos.epoch).to.equal(2);
            expect(pos.amount).to.equal(amount);
        });

        it("increases balance when called multiple times in same epoch", async () => {
            await setupJunior(happyPirate);

            await expect(sa.connect(happyPirate).exitJunior(amount.div(2))).to.not.be.reverted;

            let pos = await sa.juniorExitQueue(happyPirateAddress);
            expect(pos.epoch).to.equal(1);
            expect(pos.amount).to.equal(amount.div(2));

            await expect(sa.connect(happyPirate).exitJunior(amount.div(2))).to.not.be.reverted;

            pos = await sa.juniorExitQueue(happyPirateAddress);
            expect(pos.epoch).to.equal(1);
            expect(pos.amount).to.equal(amount);
        });
    });

    describe("junior exit (2nd step)", () => {
        it("does not work if user does not meet conditions", async () => {
            await setupJunior(happyPirate);

            await moveAtEpoch(2);
            await expect(sa.advanceEpoch()).to.not.be.reverted;

            const balance = await juniorToken.balanceOf(happyPirateAddress);
            expect(balance).to.not.equal(0);

            await expect(sa.connect(happyPirate).exitJunior(balance))
                .to.not.be.reverted;

            await expect(sa.connect(happyPirate).redeemJuniorUnderlying())
                .to.be.revertedWith("not redeemable yet");
        });

        it("works if all conditions are met", async () => {
            await setupJunior(happyPirate);

            await moveAtEpoch(2);
            await expect(sa.advanceEpoch()).to.not.be.reverted;

            const balance = await juniorToken.balanceOf(happyPirateAddress);
            expect(balance).to.not.equal(0);

            await expect(sa.connect(happyPirate).exitJunior(balance))
                .to.not.be.reverted;

            await moveAtEpoch(3);
            await expect(sa.advanceEpoch()).to.not.be.reverted;

            expect(await sa.epochBalance()).to.equal(0);

            await expect(sa.connect(happyPirate).redeemJuniorUnderlying()).to.not.be.reverted;

            expect(await juniorToken.balanceOf(sa.address)).to.equal(0);
            expect(await juniorToken.balanceOf(happyPirateAddress)).to.equal(0);
            expect(await juniorToken.totalSupply()).to.equal(0);

            expect(await poolToken.balanceOf(sa.address)).to.equal(0);
            expect(await poolToken.balanceOf(happyPirateAddress)).to.equal(amount);

            await expect(sa.connect(happyPirate).redeemJuniorUnderlying())
                .to.be.revertedWith("nothing to redeem");
        });
    });

    describe("senior exit (1st step)", () => {
        it("reverts if user does not enough senior token balance", async () => {
            await expect(sa.exitSenior(amount))
                .to.be.revertedWith("not enough balance");
        });

        it("updates the state accordingly", async () => {
            // setup for exit
            await setupSenior(happyPirate);

            const balance = await sa.epochBalance();
            expect(balance).to.not.equal(0);

            // exit and assertions
            await expect(sa.connect(happyPirate).exitSenior(amount)).to.not.be.reverted;

            // user should be added to the queue but the parameters for the current epoch
            // should not change;
            // the junior tokens should be transferred from user to the pool
            const pos = await sa.seniorExitQueue(happyPirateAddress);
            expect(pos.epoch).to.equal(1);
            expect(pos.amount).to.equal(amount);
            expect(await seniorToken.balanceOf(happyPirateAddress)).to.equal(0);
            expect(await seniorToken.balanceOf(sa.address)).to.equal(amount);
            expect(await sa.epochBalance()).to.equal(balance);

            // the junior liquidity should not be modified until the end of the epoch
            expect(await sa.epochSeniorLiquidity()).to.equal(amount);

            // moving to the next epoch, the previously queued junior should be materialized
            // into the pool parameters, in this case leaving the total balance and junior
            // liquidity at 0
            await moveAtEpoch(2);
            await expect(sa.advanceEpoch()).to.not.be.reverted;
            expect(await sa.epochBalance()).to.equal(0);
            expect(await sa.epochSeniorLiquidity()).to.equal(0);
        });

        it("automatically redeems senior underlying if there's an old position", async () => {
            await setupUser(happyPirate, amount.mul(2));

            await expect(sa.connect(happyPirate).depositSenior(amount.mul(2)))
                .to.not.be.reverted;

            await moveAtEpoch(1);

            await expect(sa.connect(happyPirate).redeemSeniorTokens()).to.not.be.reverted;

            await expect(sa.connect(happyPirate).exitSenior(amount)).to.not.be.reverted;
            let pos = await sa.seniorExitQueue(happyPirateAddress);
            expect(pos.epoch).to.equal(1);
            expect(pos.amount).to.equal(amount);

            await moveAtEpoch(2);

            await expect(sa.connect(happyPirate).exitSenior(amount)).to.not.be.reverted;

            expect(await poolToken.balanceOf(happyPirateAddress)).to.equal(amount);

            pos = await sa.seniorExitQueue(happyPirateAddress);
            expect(pos.epoch).to.equal(2);
            expect(pos.amount).to.equal(amount);
        });

        it("increases balance when called multiple times in same epoch", async () => {
            await setupSenior(happyPirate);

            await expect(sa.connect(happyPirate).exitSenior(amount.div(2))).to.not.be.reverted;

            let pos = await sa.seniorExitQueue(happyPirateAddress);
            expect(pos.epoch).to.equal(1);
            expect(pos.amount).to.equal(amount.div(2));

            await expect(sa.connect(happyPirate).exitSenior(amount.div(2))).to.not.be.reverted;

            pos = await sa.seniorExitQueue(happyPirateAddress);
            expect(pos.epoch).to.equal(1);
            expect(pos.amount).to.equal(amount);
        });
    });

    describe("senior exit (2nd step)", () => {
        it("does not work if user does not meet conditions", async () => {
            await setupSenior(happyPirate);

            await moveAtEpoch(2);
            await expect(sa.advanceEpoch()).to.not.be.reverted;

            const balance = await seniorToken.balanceOf(happyPirateAddress);
            expect(balance).to.not.equal(0);

            await expect(sa.connect(happyPirate).exitSenior(balance))
                .to.not.be.reverted;

            await expect(sa.connect(happyPirate).redeemSeniorUnderlying())
                .to.be.revertedWith("not redeemable yet");
        });

        it("works if all conditions are met", async () => {
            await setupSenior(happyPirate);

            await moveAtEpoch(2);
            await expect(sa.advanceEpoch()).to.not.be.reverted;

            const balance = await seniorToken.balanceOf(happyPirateAddress);
            expect(balance).to.not.equal(0);

            await expect(sa.connect(happyPirate).exitSenior(balance))
                .to.not.be.reverted;

            await moveAtEpoch(3);
            await expect(sa.advanceEpoch()).to.not.be.reverted;

            expect(await sa.epochBalance()).to.equal(0);

            await expect(sa.connect(happyPirate).redeemSeniorUnderlying()).to.not.be.reverted;

            expect(await seniorToken.balanceOf(sa.address)).to.equal(0);
            expect(await seniorToken.balanceOf(happyPirateAddress)).to.equal(0);
            expect(await seniorToken.totalSupply()).to.equal(0);

            expect(await poolToken.balanceOf(sa.address)).to.equal(0);
            expect(await poolToken.balanceOf(happyPirateAddress)).to.equal(amount);

            await expect(sa.connect(happyPirate).redeemSeniorUnderlying())
                .to.be.revertedWith("nothing to redeem");
        });
    });

    describe("profits and losses", () => {
        it("calculates profits correctly", async () => {
            await oracle.setPrice(100);

            await setupUser(happyPirate);
            await setupUser(flyingParrot);

            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).depositSenior(amount)).to.not.be.reverted;

            await moveAtEpoch(1);
            await expect(sa.advanceEpoch()).to.not.be.reverted;

            await oracle.setPrice(200);
            await moveAtEpoch(2);

            // 100 eth juniors + 100 eth seniors with 25% upside exposure rate, price doubles
            // junior profits = (cP - eP) * (1 - upR) * seniors / cP
            const upR = await model.getUpsideExposureRate(amount, amount);
            const dR = await model.getDownsideProtectionRate(amount, amount);
            const expectedProfits = tenPow18.sub(upR).mul(100).mul(amount).div(200).div(tenPow18);

            expect(await sa.getCurrentJuniorProfits()).to.equal(expectedProfits);
            expect(await sa.getCurrentSeniorProfits()).to.equal(0);
            await expect(sa.advanceEpoch()).to.not.be.reverted;
        });

        it("calculates losses correctly", async () => {
            await oracle.setPrice(200);

            await setupUser(happyPirate);
            await setupUser(flyingParrot);

            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).depositSenior(amount)).to.not.be.reverted;

            await moveAtEpoch(1);
            await expect(sa.advanceEpoch()).to.not.be.reverted;

            await oracle.setPrice(100);
            await moveAtEpoch(2);

            // 100 eth juniors + 100 eth seniors with 25% downside protection rate, price halves
            // losses = seniors * (eP / (max(cp, eP*(1-dR)) - 1)
            const dR = await model.getDownsideProtectionRate(amount, amount);
            const minPrice = BigNumber.from(200).mul(tenPow18.sub(dR)).div(tenPow18).add(1);
            let max = minPrice;
            if (minPrice.lt(100)) {
                max = BigNumber.from(100);
            }
            const expectedLoss = amount.mul(tenPow18.mul(200).div(max).sub(tenPow18)).div(tenPow18);
            expectEqualWithDust(await sa.getCurrentSeniorProfits(), expectedLoss);
            expect(await sa.getCurrentJuniorProfits()).to.equal(0);
        });
    });

    describe("advanced tests", () => {
        it("junior user can claim his tokens after many epochs", async () => {
            await setupUser(happyPirate);

            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;

            for (let i = 1; i <= 5; i++) {
                await moveAtEpoch(i);
                await sa.advanceEpoch();
                expect(await juniorToken.balanceOf(sa.address)).to.equal(amount);
            }

            await moveAtEpoch(20);
            await expect(sa.connect(happyPirate).redeemJuniorTokens()).to.not.be.reverted;
            expect(await juniorToken.balanceOf(sa.address)).to.equal(0);
            expect(await juniorToken.balanceOf(happyPirateAddress)).to.equal(amount);
        });

        it("senior user can claim his tokens after many epochs", async () => {
            await setupUser(happyPirate);

            await expect(sa.connect(happyPirate).depositSenior(amount)).to.not.be.reverted;

            for (let i = 1; i <= 5; i++) {
                await moveAtEpoch(i);
                await sa.advanceEpoch();
                expect(await seniorToken.balanceOf(sa.address)).to.equal(amount);
            }

            await moveAtEpoch(20);
            await expect(sa.connect(happyPirate).redeemSeniorTokens()).to.not.be.reverted;
            expect(await seniorToken.balanceOf(sa.address)).to.equal(0);
            expect(await seniorToken.balanceOf(happyPirateAddress)).to.equal(amount);
        });

        it("junior user can claim his underlying after many epochs", async () => {
            await setupJunior(happyPirate);
            await oracle.setPrice(12321213);

            await expect(sa.connect(happyPirate).exitJunior(amount)).to.not.be.reverted;

            for (let i = 2; i <= 5; i++) {
                await moveAtEpoch(i);
                await sa.advanceEpoch();
                expect(await juniorToken.balanceOf(sa.address)).to.equal(0);
                expect(await poolToken.balanceOf(sa.address)).to.equal(amount);
                expect(await sa.epochBalance()).to.equal(0);
            }

            await moveAtEpoch(20);

            await expect(sa.connect(happyPirate).redeemJuniorUnderlying()).to.not.be.reverted;
            expect(await poolToken.balanceOf(happyPirateAddress)).to.equal(amount);
            expect(await poolToken.balanceOf(sa.address)).to.equal(0);
        });

        it("senior user can claim his underlying after many epochs", async () => {
            await oracle.setPrice(100);
            await setupSenior(happyPirate);

            await expect(sa.connect(happyPirate).exitSenior(amount)).to.not.be.reverted;
            await moveAtEpoch(2);
            await sa.advanceEpoch();
            await oracle.setPrice(200);

            for (let i = 3; i <= 7; i++) {
                await moveAtEpoch(i);
                await sa.advanceEpoch();
                expect(await seniorToken.balanceOf(sa.address)).to.equal(0);
                expect(await poolToken.balanceOf(sa.address)).to.equal(amount);
                expect(await sa.epochBalance()).to.equal(0);
            }

            await moveAtEpoch(20);

            await expect(sa.connect(happyPirate).redeemSeniorUnderlying()).to.not.be.reverted;
            expect(await poolToken.balanceOf(happyPirateAddress)).to.equal(amount);
            expect(await poolToken.balanceOf(sa.address)).to.equal(0);
        });

        it("price goes up #1", async () => {
            await setupUser(happyPirate);
            await setupUser(flyingParrot);

            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).depositSenior(amount)).to.not.be.reverted;

            await setPriceAndMoveAtEpoch(100, 1);

            expect(await sa.epochBalance()).to.equal(amount.mul(2));
            expect(await sa.epochJuniorLiquidity()).to.equal(amount);
            expect(await sa.epochSeniorLiquidity()).to.equal(amount);

            await expect(sa.connect(happyPirate).redeemJuniorTokens()).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).redeemSeniorTokens()).to.not.be.reverted;

            let upRate = await sa.epochUpsideExposureRate();

            await setPriceAndMoveAtEpoch(150, 2);

            const expectedProfits1 = calcJuniorProfits(150, 100, upRate, amount);
            expect(await sa.epochSeniorLiquidity()).to.equal(amount.sub(expectedProfits1));
            expect(await sa.epochJuniorLiquidity()).to.equal(amount.add(expectedProfits1));

            await expect(sa.connect(happyPirate).exitJunior(amount.div(2))).to.not.be.reverted;

            await moveAtEpoch(3);
            // supposing price does not change
            await expect(sa.advanceEpoch()).to.not.be.reverted;
            await expect(sa.connect(happyPirate).redeemJuniorUnderlying()).to.not.be.reverted;

            // user only withdrew half of the tokens
            expect(await juniorToken.balanceOf(happyPirateAddress)).to.equal(amount.div(2));
            expectEqualWithDust(await poolToken.balanceOf(happyPirateAddress), amount.add(expectedProfits1).div(2));

            await expect(sa.connect(flyingParrot).exitSenior(amount)).to.not.be.reverted;

            upRate = await sa.epochUpsideExposureRate();

            await setPriceAndMoveAtEpoch(200, 4);

            const expectedSeniorBalance = amount.sub(expectedProfits1);
            const expectedProfits2 = calcJuniorProfits(200, 150, upRate, expectedSeniorBalance);
            expect(await seniorToken.balanceOf(sa.address)).to.equal(0);
            expect(await seniorToken.balanceOf(flyingParrotAddress)).to.equal(0);

            await (expect(sa.connect(flyingParrot).redeemSeniorUnderlying())).to.not.be.reverted;
            expectEqualWithDust(
                await poolToken.balanceOf(flyingParrotAddress),
                expectedSeniorBalance.sub(expectedProfits2),
            );
            expect(await poolToken.balanceOf(flyingParrotAddress));
        });

        it("price goes down #1", async () => {
            await setupUser(happyPirate);
            await setupUser(flyingParrot);

            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).depositSenior(amount)).to.not.be.reverted;

            await setPriceAndMoveAtEpoch(100, 1);

            expect(await sa.epochBalance()).to.equal(amount.mul(2));
            expect(await sa.epochJuniorLiquidity()).to.equal(amount);
            expect(await sa.epochSeniorLiquidity()).to.equal(amount);

            await expect(sa.connect(happyPirate).redeemJuniorTokens()).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).redeemSeniorTokens()).to.not.be.reverted;

            // price is above minPrice
            let downsideRate = await sa.epochDownsideProtectionRate();

            const expectedSeniorProfits1 = calcSeniorProfits(90, 100, downsideRate, amount);
            const expectedSeniors1 = amount.add(expectedSeniorProfits1);

            await setPriceAndMoveAtEpoch(90, 2);

            expect(await sa.epochSeniorLiquidity()).to.equal(expectedSeniors1);
            expect(await sa.epochJuniorLiquidity()).to.equal(amount.sub(expectedSeniorProfits1));
            expect(await sa.epochBalance()).to.equal(amount.mul(2));

            // price goes below minPrice
            downsideRate = await sa.epochDownsideProtectionRate();
            const expectedSeniorProfits2 = calcSeniorProfits(50, 90, downsideRate, expectedSeniors1);
            const expectedSeniors2 = expectedSeniors1.add(expectedSeniorProfits2);

            await setPriceAndMoveAtEpoch(50, 3);

            expect(await sa.epochSeniorLiquidity()).to.equal(expectedSeniors2);
            expect(await sa.epochJuniorLiquidity()).to.equal(
                amount.sub(expectedSeniorProfits1).sub(expectedSeniorProfits2),
            );

            await expect(sa.connect(flyingParrot).exitSenior(amount.div(2))).to.not.be.reverted;

            await moveAtEpoch(4);
            await expect(sa.advanceEpoch()).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).redeemSeniorUnderlying()).to.not.be.reverted;

            expect(await seniorToken.balanceOf(flyingParrotAddress)).to.equal(amount.div(2));

            const actualBalance = await poolToken.balanceOf(flyingParrotAddress);
            expectEqualWithDust(actualBalance, expectedSeniors2.div(2));
            expect(await sa.epochBalance()).to.equal(amount.mul(2).sub(actualBalance));
        });

        it("token prices are not influenced if tokens are sent directly to pool", async () => {
            await setupUser(happyPirate);
            await setupUser(flyingParrot);

            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).depositSenior(amount)).to.not.be.reverted;

            await setPriceAndMoveAtEpoch(100, 1);

            await expect(sa.connect(happyPirate).redeemJuniorTokens()).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).redeemSeniorTokens()).to.not.be.reverted;

            const jTokenPriceBefore = await sa.getEpochJuniorTokenPrice();
            const sTokenPriceBefore = await sa.getEpochSeniorTokenPrice();

            const a = amount.mul(100000);
            await poolToken.mint(happyPirateAddress, a);
            await poolToken.connect(happyPirate).transfer(sa.address, a);

            expect(await sa.getEpochJuniorTokenPrice()).to.equal(jTokenPriceBefore);
            expect(await sa.getEpochSeniorTokenPrice()).to.equal(sTokenPriceBefore);

            await moveAtEpoch(2);

            await expect(sa.advanceEpoch()).to.not.be.reverted;

            expect(await sa.getEpochJuniorTokenPrice()).to.equal(jTokenPriceBefore);
            expect(await sa.getEpochSeniorTokenPrice()).to.equal(sTokenPriceBefore);
        });

        it("tokens sent directly to pool are considered fees", async () => {
            await setupUser(happyPirate);
            await setupUser(flyingParrot);

            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).depositSenior(amount)).to.not.be.reverted;

            await setPriceAndMoveAtEpoch(100, 1);

            await expect(sa.connect(happyPirate).redeemJuniorTokens()).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).redeemSeniorTokens()).to.not.be.reverted;

            const feesBefore = await sa.feesAccrued();
            expect(feesBefore).to.equal(0);

            const a = amount.mul(100000);
            await poolToken.mint(happyPirateAddress, a);
            await poolToken.connect(happyPirate).transfer(sa.address, a);

            expect(await sa.feesAccrued()).to.equal(a);
        });
    });

    describe("fees", () => {
        it("does not affect balance if fees percentage is 0", async () => {
            await setupUser(happyPirate);
            await setupUser(flyingParrot);

            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).depositSenior(amount)).to.not.be.reverted;

            await setPriceAndMoveAtEpoch(100, 1);

            expect(await sa.feesAccrued()).to.equal(0);

            const balanceBefore = await sa.epochBalance();

            await setPriceAndMoveAtEpoch(200, 2);

            expect(await sa.feesAccrued()).to.equal(0);
            expect(await sa.epochBalance()).to.equal(balanceBefore);
        });

        it("takes fees from seniors if price goes down", async () => {
            await setupForFees();

            const downsideRate = await sa.epochDownsideProtectionRate();
            const expectedSeniorProfits = calcSeniorProfits(75, 100, downsideRate, amount);
            const expectedFee = expectedSeniorProfits.mul(feesPercentage).div(tenPow18);
            expect(expectedFee.gt(0)).to.be.true;

            await setPriceAndMoveAtEpoch(75, 2);

            expect(await sa.feesAccrued()).to.equal(expectedFee);
            expect(await sa.epochJuniorLiquidity()).to.equal(amount.sub(expectedSeniorProfits));
            expect(await sa.epochSeniorLiquidity()).to.equal(amount.add(expectedSeniorProfits).sub(expectedFee));
            expect(await sa.epochBalance()).to.equal(amount.mul(2).sub(expectedFee));

            // move another epoch but no price change => everything should remain the same
            await moveAtEpoch(3);
            await expect(sa.advanceEpoch()).to.not.be.reverted;

            expect(await sa.feesAccrued()).to.equal(expectedFee);
            expect(await sa.epochJuniorLiquidity()).to.equal(amount.sub(expectedSeniorProfits));
            expect(await sa.epochSeniorLiquidity()).to.equal(amount.add(expectedSeniorProfits).sub(expectedFee));
            expect(await sa.epochBalance()).to.equal(amount.mul(2).sub(expectedFee));
        });

        it("takes fees from juniors if price goes up", async () => {
            await setupForFees();

            const upR = await sa.epochUpsideExposureRate();
            const expectedJuniorProfits = calcJuniorProfits(150, 100, upR, amount);
            const expectedFee = expectedJuniorProfits.mul(feesPercentage).div(tenPow18);
            expect(expectedFee.gt(0)).to.be.true;

            await setPriceAndMoveAtEpoch(150, 2);

            expect(await sa.feesAccrued()).to.equal(expectedFee);
            expect(await sa.epochSeniorLiquidity()).to.equal(amount.sub(expectedJuniorProfits));
            expect(await sa.epochJuniorLiquidity()).to.equal(amount.add(expectedJuniorProfits).sub(expectedFee));
            expect(await sa.epochBalance()).to.equal(amount.mul(2).sub(expectedFee));

            // move another epoch but no price change => everything should remain the same
            await moveAtEpoch(3);
            await expect(sa.advanceEpoch()).to.not.be.reverted;

            expect(await sa.feesAccrued()).to.equal(expectedFee);
            expect(await sa.epochSeniorLiquidity()).to.equal(amount.sub(expectedJuniorProfits));
            expect(await sa.epochJuniorLiquidity()).to.equal(amount.add(expectedJuniorProfits).sub(expectedFee));
            expect(await sa.epochBalance()).to.equal(amount.mul(2).sub(expectedFee));
        });

        it("takes fees correctly in mixed results", async () => {
            await setupForFees();

            // price goes down, fee is taken from seniors
            const downsideRate = await sa.epochDownsideProtectionRate();
            const expectedSeniorProfits = calcSeniorProfits(75, 100, downsideRate, amount);
            const expectedFee1 = expectedSeniorProfits.mul(feesPercentage).div(tenPow18);
            expect(expectedFee1.gt(0)).to.be.true;

            await setPriceAndMoveAtEpoch(75, 2);

            const expectedSeniors = amount.add(expectedSeniorProfits).sub(expectedFee1);
            const expectedJuniors = amount.sub(expectedSeniorProfits);

            expect(await sa.feesAccrued()).to.equal(expectedFee1);
            expect(await sa.epochJuniorLiquidity()).to.equal(expectedJuniors);
            expect(await sa.epochSeniorLiquidity()).to.equal(expectedSeniors);
            expect(await sa.epochBalance()).to.equal(amount.mul(2).sub(expectedFee1));

            // price goes up, fee is taken from juniors
            const upR = await sa.epochUpsideExposureRate();
            const expectedJuniorProfits = calcJuniorProfits(150, 75, upR, expectedSeniors);
            const expectedFee2 = expectedJuniorProfits.mul(feesPercentage).div(tenPow18);
            expect(expectedFee2.gt(0)).to.be.true;

            await setPriceAndMoveAtEpoch(150, 3);

            expect(await sa.feesAccrued()).to.equal(expectedFee1.add(expectedFee2));
            expect(await sa.epochSeniorLiquidity()).to.equal(expectedSeniors.sub(expectedJuniorProfits));
            expect(await sa.epochJuniorLiquidity()).to.equal(expectedJuniors.add(expectedJuniorProfits).sub(expectedFee2));
            expect(await sa.epochBalance()).to.equal(amount.mul(2).sub(expectedFee1).sub(expectedFee2));
        });

        describe("transferFees", () => {
            it("reverts if no fees were accrued", async () => {
                await expect(sa.transferFees()).to.be.revertedWith("no fees");
            });

            it("transfers the amount of pool token to fees owner and resets counter", async () => {
                await setupForFees();

                // generate some fees
                await setPriceAndMoveAtEpoch(75, 2);

                const fees = await sa.feesAccrued();
                await expect(sa.transferFees()).to.not.be.reverted;
                expect(await poolToken.balanceOf(deployerAddress)).to.equal(fees);
                expect(await sa.feesAccrued()).to.equal(0);
            });
        });
    });

    describe("Events", () => {
        it("junior deposit", async () => {
            await setupUser(happyPirate);

            await expect(sa.connect(happyPirate).depositJunior(amount.div(2)))
                .to.emit(sa, "JuniorJoinEntryQueue")
                .withArgs(happyPirateAddress, 0, amount.div(2), amount.div(2));

            await expect(sa.connect(happyPirate).depositJunior(amount.div(2)))
                .to.emit(sa, "JuniorJoinEntryQueue")
                .withArgs(happyPirateAddress, 0, amount.div(2), amount);
        });

        it("junior deposit 2nd step", async () => {
            await setupUser(happyPirate);

            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;

            await moveAtEpoch(1);

            await expect(sa.connect(happyPirate).redeemJuniorTokens())
                .to.emit(sa, "JuniorRedeemTokens")
                .withArgs(happyPirateAddress, 0, amount);
        });

        it("junior exit", async () => {
            await setupJunior(happyPirate);

            await expect(sa.connect(happyPirate).exitJunior(amount.div(2)))
                .to.emit(sa, "JuniorJoinExitQueue")
                .withArgs(happyPirateAddress, 1, amount.div(2), amount.div(2));

            await expect(sa.connect(happyPirate).exitJunior(amount.div(2)))
                .to.emit(sa, "JuniorJoinExitQueue")
                .withArgs(happyPirateAddress, 1, amount.div(2), amount);
        });

        it("junior exit 2nd step", async () => {
            await setupJunior(happyPirate);
            await expect(sa.connect(happyPirate).exitJunior(amount)).to.not.be.reverted;

            await moveAtEpoch(2);

            await expect(sa.connect(happyPirate).redeemJuniorUnderlying())
                .to.emit(sa, "JuniorRedeemUnderlying")
                .withArgs(happyPirateAddress, 1, amount);
        });

        it("senior deposit", async () => {
            await setupUser(happyPirate);

            await expect(sa.connect(happyPirate).depositSenior(amount.div(2)))
                .to.emit(sa, "SeniorJoinEntryQueue")
                .withArgs(happyPirateAddress, 0, amount.div(2), amount.div(2));

            await expect(sa.connect(happyPirate).depositSenior(amount.div(2)))
                .to.emit(sa, "SeniorJoinEntryQueue")
                .withArgs(happyPirateAddress, 0, amount.div(2), amount);
        });

        it("senior deposit 2nd step", async () => {
            await setupUser(happyPirate);

            await expect(sa.connect(happyPirate).depositSenior(amount)).to.not.be.reverted;

            await moveAtEpoch(1);

            await expect(sa.connect(happyPirate).redeemSeniorTokens())
                .to.emit(sa, "SeniorRedeemTokens")
                .withArgs(happyPirateAddress, 0, amount);
        });

        it("senior exit", async () => {
            await setupSenior(happyPirate);

            await expect(sa.connect(happyPirate).exitSenior(amount.div(2)))
                .to.emit(sa, "SeniorJoinExitQueue")
                .withArgs(happyPirateAddress, 1, amount.div(2), amount.div(2));

            await expect(sa.connect(happyPirate).exitSenior(amount.div(2)))
                .to.emit(sa, "SeniorJoinExitQueue")
                .withArgs(happyPirateAddress, 1, amount.div(2), amount);
        });

        it("senior exit 2nd step", async () => {
            await setupSenior(happyPirate);
            await expect(sa.connect(happyPirate).exitSenior(amount)).to.not.be.reverted;

            await moveAtEpoch(2);

            await expect(sa.connect(happyPirate).redeemSeniorUnderlying())
                .to.emit(sa, "SeniorRedeemUnderlying")
                .withArgs(happyPirateAddress, 1, amount);
        });

        it("epoch end", async () => {
            await moveAtEpoch(1);
            await expect(sa.advanceEpoch())
                .to.emit(sa, "EpochEnd")
                .withArgs(0, 0, 0);


            await setPriceAndMoveAtEpoch(100, 2);

            await setupUser(happyPirate);
            await setupUser(flyingParrot);
            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).depositSenior(amount)).to.not.be.reverted;

            await oracle.setPrice(150);
            const expectedJuniorProfits = await sa.getCurrentJuniorProfits();

            await moveAtEpoch(3);
            await expect(sa.advanceEpoch())
                .to.emit(sa, "EpochEnd")
                .withArgs(2, expectedJuniorProfits, 0);
        });

        it("transfer fees", async () => {
            await setupForFees();

            // generate some fees
            await setPriceAndMoveAtEpoch(75, 2);

            const expectedFees = await sa.feesAccrued();

            await expect(sa.transferFees())
                .to.emit(sa, "FeesTransfer")
                .withArgs(deployerAddress, deployerAddress, expectedFees);
        });

        describe("Governance events", () => {
            it("transfer dao", async () => {
                await expect(sa.connect(deployer).transferDAO(happyPirateAddress))
                    .to.emit(sa, "TransferDAO")
                    .withArgs(deployerAddress, happyPirateAddress);
            });

            it("transfer guardian", async () => {
                await expect(sa.connect(deployer).transferGuardian(happyPirateAddress))
                    .to.emit(sa, "TransferGuardian")
                    .withArgs(flyingParrotAddress, happyPirateAddress);
            });

            it("pause system", async () => {
                await expect(sa.connect(deployer).pauseSystem())
                    .to.emit(sa, "PauseSystem");
            });

            it("resume system", async () => {
                await expect(sa.connect(deployer).pauseSystem()).to.not.be.reverted;
                await expect(sa.connect(deployer).resumeSystem())
                    .to.emit(sa, "ResumeSystem");
            });

            it("set price oracle", async () => {
                const newOracle = await deployContract("OracleMock");
                await expect(sa.connect(deployer).setPriceOracle(newOracle.address))
                    .to.emit(sa, "SetPriceOracle")
                    .withArgs(oracle.address, newOracle.address);
            });

            it("set senior rate model", async () => {
                const newModel = await deployContract("SeniorRateModel");

                await expect(sa.connect(deployer).setSeniorRateModel(newModel.address))
                    .to.emit(sa, "SetSeniorRateModel")
                    .withArgs(model.address, newModel.address);
            });

            it("set accounting model", async () => {
                const newModel = await deployContract("AccountingModel");

                await expect(sa.connect(deployer).setAccountingModel(newModel.address))
                    .to.emit(sa, "SetAccountingModel")
                    .withArgs(accountingModel.address, newModel.address);
            });

            it("set fees owner", async () => {
                await expect(sa.connect(deployer).setFeesOwner(happyPirateAddress))
                    .to.emit(sa, "SetFeesOwner")
                    .withArgs(zeroAddress, happyPirateAddress);
            });

            it("set fees percentage", async () => {
                await expect(sa.connect(deployer).setFeesOwner(deployerAddress)).to.not.be.reverted;
                await expect(sa.connect(deployer).setFeesPercentage(tenPow18.mul(2).div(100)))
                    .to.emit(sa, "SetFeesPercentage")
                    .withArgs(0, tenPow18.mul(2).div(100));
            });
        });
    });

    describe("estimate* functions", () => {
        it("liquidity returns correct info", async () => {
            expect(await sa.estimateCurrentJuniorLiquidity()).to.equal(0);
            expect(await sa.estimateCurrentSeniorLiquidity()).to.equal(0);

            await setupUser(happyPirate);
            await setupUser(flyingParrot);

            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).depositSenior(amount)).to.not.be.reverted;

            await setPriceAndMoveAtEpoch(100, 1);

            expect(await sa.estimateCurrentJuniorLiquidity()).to.equal(amount);
            expect(await sa.estimateCurrentSeniorLiquidity()).to.equal(amount);

            await oracle.setPrice(150);

            const expectedJuniorProfit = calcJuniorProfits(150, 100, await sa.epochUpsideExposureRate(), amount);
            const estimatedJuniorLiq = await sa.estimateCurrentJuniorLiquidity();
            const estimatedSeniorLiq = await sa.estimateCurrentSeniorLiquidity();

            // fee is not set
            expect(estimatedJuniorLiq).to.equal(amount.add(expectedJuniorProfit));
            expect(estimatedSeniorLiq).to.equal(amount.sub(expectedJuniorProfit));

            await moveAtEpoch(2);
            await expect(sa.advanceEpoch()).to.not.be.reverted;

            expect(await sa.epochJuniorLiquidity()).to.equal(estimatedJuniorLiq);
            expect(await sa.epochSeniorLiquidity()).to.equal(estimatedSeniorLiq);
        });

        it("liquidity returns correct info with fees", async () => {
            await setupForFees();

            expect(await sa.estimateCurrentJuniorLiquidity()).to.equal(amount);
            expect(await sa.estimateCurrentSeniorLiquidity()).to.equal(amount);

            await oracle.setPrice(150);
            const expectedProfit = calcJuniorProfits(150, 100, await sa.epochUpsideExposureRate(), amount);
            const expectedFee = expectedProfit.mul(feesPercentage).div(tenPow18);
            const estimatedJuniorLiq = await sa.estimateCurrentJuniorLiquidity();
            const estimatedSeniorLiq = await sa.estimateCurrentSeniorLiquidity();

            expect(estimatedJuniorLiq).to.equal(amount.add(expectedProfit).sub(expectedFee));
            expect(estimatedSeniorLiq).to.equal(amount.sub(expectedProfit));

            await moveAtEpoch(2);
            await expect(sa.advanceEpoch()).to.not.be.reverted;

            expect(await sa.epochJuniorLiquidity()).to.equal(estimatedJuniorLiq);
            expect(await sa.epochSeniorLiquidity()).to.equal(estimatedSeniorLiq);

            await oracle.setPrice(100);

            const expectedSeniorProfits = calcSeniorProfits(
                100, 150, await sa.epochDownsideProtectionRate(), estimatedSeniorLiq,
            );
            const expectedFee2 = expectedSeniorProfits.mul(feesPercentage).div(tenPow18);
            const estimatedJuniorLiq2 = await sa.estimateCurrentJuniorLiquidity();
            const estimatedSeniorLiq2 = await sa.estimateCurrentSeniorLiquidity();

            expect(estimatedJuniorLiq2).to.equal(estimatedJuniorLiq.sub(expectedSeniorProfits));
            expect(estimatedSeniorLiq2).to.equal(estimatedSeniorLiq.add(expectedSeniorProfits).sub(expectedFee2));

            await moveAtEpoch(3);
            await expect(sa.advanceEpoch()).to.not.be.reverted;

            expect(await sa.epochJuniorLiquidity()).to.equal(estimatedJuniorLiq2);
            expect(await sa.epochSeniorLiquidity()).to.equal(estimatedSeniorLiq2);
        });

        it("token price returns correct info", async () => {
            expect(await sa.estimateCurrentJuniorTokenPrice()).to.equal(tenPow18);
            expect(await sa.estimateCurrentSeniorTokenPrice()).to.equal(tenPow18);

            await setupUser(happyPirate);
            await setupUser(flyingParrot);

            await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;
            await expect(sa.connect(flyingParrot).depositSenior(amount)).to.not.be.reverted;

            await setPriceAndMoveAtEpoch(100, 1);

            expect(await sa.estimateCurrentJuniorTokenPrice()).to.equal(tenPow18);
            expect(await sa.estimateCurrentSeniorTokenPrice()).to.equal(tenPow18);

            await oracle.setPrice(150);
            let expectedJuniorLiq = await sa.estimateCurrentJuniorLiquidity();
            let expectedSeniorLiq = await sa.estimateCurrentSeniorLiquidity();

            expect(await sa.estimateCurrentJuniorTokenPrice()).to.equal(expectedJuniorLiq.mul(tenPow18).div(amount));
            expect(await sa.estimateCurrentSeniorTokenPrice()).to.equal(expectedSeniorLiq.mul(tenPow18).div(amount));

            await oracle.setPrice(90);
            expectedJuniorLiq = await sa.estimateCurrentJuniorLiquidity();
            expectedSeniorLiq = await sa.estimateCurrentSeniorLiquidity();

            const expectedJuniorTokenPrice = await sa.estimateCurrentJuniorTokenPrice();
            const expectedSeniorTokenPrice = await sa.estimateCurrentSeniorTokenPrice();

            expect(expectedJuniorTokenPrice).to.equal(expectedJuniorLiq.mul(tenPow18).div(amount));
            expect(expectedSeniorTokenPrice).to.equal(expectedSeniorLiq.mul(tenPow18).div(amount));

            await moveAtEpoch(2);
            await expect(sa.advanceEpoch()).to.not.be.reverted;

            expect(await sa.getEpochJuniorTokenPrice()).to.equal(expectedJuniorTokenPrice);
            expect(await sa.getEpochSeniorTokenPrice()).to.equal(expectedSeniorTokenPrice);
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

    async function setupForFees () {
        await sa.connect(deployer).setFeesOwner(deployerAddress);
        await sa.connect(deployer).setFeesPercentage(feesPercentage);

        await setupUser(happyPirate);
        await setupUser(flyingParrot);

        await expect(sa.connect(happyPirate).depositJunior(amount)).to.not.be.reverted;
        await expect(sa.connect(flyingParrot).depositSenior(amount)).to.not.be.reverted;

        await setPriceAndMoveAtEpoch(100, 1);
    }

    async function setPriceAndMoveAtEpoch (price: number, epoch: number) {
        await oracle.setPrice(price);
        await moveAtEpoch(epoch);
        await expect(sa.advanceEpoch()).to.not.be.reverted;
    }

    async function moveAtEpoch (epoch: number) {
        await moveAtTimestamp(epoch1Start + epochDuration * (epoch - 1));
    }

    function e8 (x: number): BigNumber {
        return tenPow8.mul(x);
    }
});


