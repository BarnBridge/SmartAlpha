import { ethers } from "hardhat";
import { expect } from "chai";
import { getLatestBlockTimestamp, moveAtTimestamp, tenPow18 } from "./helpers/helpers";
import { deployContract } from "./helpers/deploy";
import { SeniorRateModel, SeniorRateModelV3 } from "../typechain";
import { BigNumber, BigNumberish } from "ethers";
import { expectEqualWithDust } from "./helpers/assertions";

describe("SeniorRateModel", () => {
    let snapshotId: any;

    beforeEach(async function () {
        snapshotId = await ethers.provider.send("evm_snapshot", []);
    });

    afterEach(async function () {
        const ts = await getLatestBlockTimestamp();

        await ethers.provider.send("evm_revert", [snapshotId]);

        await moveAtTimestamp(ts + 5);
    });

    describe("Senior rate model v1", () => {
        let model: SeniorRateModel;

        before(async function () {
            model = (await deployContract("SeniorRateModel")) as SeniorRateModel;
        });

        describe("rates sum", () => {
            it("returns 1 if no juniors", async () => {
                expect(await model.calcRateSum(0, 10)).to.equal(getPercentBN(100));
            });

            it("returns 0.6 if 30% juniors", async () => {
                expectEqualWithDust(await model.calcRateSum(3, 7), getPercentBN(60));
            });

            it("returns 0.8 if 100% juniors", async () => {
                expectEqualWithDust(await model.calcRateSum(10, 0), getPercentBN(80));
            });
        });

        describe("Downside protection", () => {
            it("returns 0 if the pool is empty", async () => {
                expect(await model.getDownsideProtectionRate(0, 0)).to.equal(0);
            });

            it("returns 80% of junior dominance if below 0.3", async () => {
                expect(await model.getDownsideProtectionRate(2, 8)).to.equal(getPercentBN(16));
            });

            it("returns hard cap if above", async () => {
                expect(await model.getDownsideProtectionRate(8, 3)).to.equal(getPercentBN(35));
            });

            it("returns 0 if no juniors", async () => {
                expect(await model.getDownsideProtectionRate(0, 10)).to.equal(0);
            });
        });

        describe("Upside exposure", () => {
            it("returns 1 if no juniors", async () => {
                expect(await model.getUpsideExposureRate(0, 10)).to.equal(getPercentBN(100));
            });

            it("returns correct values", async () => {
                expectEqualWithDust(await model.getUpsideExposureRate(3, 7), getPercentBN(36));
            });
        });
    });

    describe("Senior rate model v3", () => {
        let modelV3: SeniorRateModelV3;
        before(async () => {
            modelV3 = (await deployContract("SeniorRateModelV3", [])) as SeniorRateModelV3;
        });

        describe("rates sum", () => {
            it("returns 1 if no juniors", async () => {
                expect(await modelV3.calcRateSum(0, 10)).to.equal(getPercentBN(100));
            });

            it("returns 0.1 if 5% juniors", async () => {
                expectEqualWithDust(await modelV3.calcRateSum(5, 95), getPercentBN(10));
            });

            it("returns 1 if 100% juniors", async () => {
                expectEqualWithDust(await modelV3.calcRateSum(10, 0), getPercentBN(100));
            });
        });

        describe("Downside protection", () => {
            it("returns 0 if the pool is empty", async () => {
                expect(await modelV3.getDownsideProtectionRate(0, 0)).to.equal(0);
            });

            it("returns 80% of junior dominance if below 0.3", async () => {
                expect(await modelV3.getDownsideProtectionRate(2, 8)).to.equal(getPercentBN(16));
            });

            it("returns hard cap if above", async () => {
                expect(await modelV3.getDownsideProtectionRate(8, 3)).to.equal(getPercentBN(35));
            });

            it("returns 0 if no juniors", async () => {
                expect(await modelV3.getDownsideProtectionRate(0, 10)).to.equal(0);
            });
        });

        describe("Upside exposure", () => {
            it("returns 1 if no juniors", async () => {
                expect(await modelV3.getUpsideExposureRate(0, 10)).to.equal(getPercentBN(100));
            });

            it("returns small value when low on juniors", async () => {
                expectEqualWithDust(await modelV3.getUpsideExposureRate(5, 95), getPercentBN(6));
            });

            it("continues to increase after downside protection rate is capped", async () => {
                const p1 = await modelV3.getUpsideExposureRate(4375, 5625);
                const p2 = await modelV3.getUpsideExposureRate(5000, 5000);
                const p3 = await modelV3.getUpsideExposureRate(6000, 4000);

                expect(p2.gt(p1)).to.be.true;
                expect(p3.gt(p2)).to.be.true;
            });
        });
    });
});

async function printRates (model: SeniorRateModel, junior: number, senior: number) {
    const rates = await model.getRates(junior, senior);
    console.log(`${junior * 100 / (junior + senior)}% juniors: ${formatRate(rates[1])}% down, ${formatRate(rates[0])}% up`);
}

function formatRate (rate: BigNumber): number {
    return rate.mul(10000).div(tenPow18).toNumber() / 100;
}

function getPercentBN (percent: BigNumberish): BigNumber {
    return BigNumber.from(percent).mul(tenPow18).div(100);
}
