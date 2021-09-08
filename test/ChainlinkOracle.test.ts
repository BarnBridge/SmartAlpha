import { ethers } from "hardhat";
import { deployContract } from "./helpers/deploy";
import { AggregatorV3Mock, ChainlinkOracle, ChainlinkOracleReverse } from "../typechain";
import { expect } from "chai";
import { tenPow8, zeroAddress } from "./helpers/helpers";
import { BigNumber, ContractFactory } from "ethers";

describe("ChainlinkOracle", () => {
    let snapshotId: any;

    let agg: AggregatorV3Mock;

    before(async function () {
        agg = (await deployContract("AggregatorV3Mock")) as AggregatorV3Mock;
    });

    beforeEach(async () => {
        snapshotId = await ethers.provider.send("evm_snapshot", []);
    });

    afterEach(async () => {
        await ethers.provider.send("evm_revert", [snapshotId]);
    });

    describe("getPrice()", () => {
        it("can be deployed", async () => {
            const factory: ContractFactory = await ethers.getContractFactory("ChainlinkOracle");

            await expect(factory.deploy(zeroAddress))
                .to.be.revertedWith("oracle cannot be 0x0");
        });

        it("returns the price from the aggregator", async () => {
            const oracle = (await deployContract("ChainlinkOracle", [agg.address])) as ChainlinkOracle;

            await agg.setDecimals(8);
            await agg.setAnswer(tenPow8.mul(100));

            expect(await oracle.getPrice()).to.equal(tenPow8.mul(100));
        });
    });

    describe("reversed price", () => {
        it("can be deployed", async () => {
            const factory: ContractFactory = await ethers.getContractFactory("ChainlinkOracleReverse");

            await expect(factory.deploy(zeroAddress))
                .to.be.revertedWith("oracle cannot be 0x0");
        });


        it("returns the price reversed from the aggregator", async () => {
            const oracle = (await deployContract("ChainlinkOracleReverse", [agg.address])) as ChainlinkOracleReverse;

            await agg.setDecimals(18);

            // BTC/ETH price scaled with 18 decimals
            await agg.setAnswer(BigNumber.from("14504330914249000000"));

            // returns ETH/BTC price scaled with 8 decimals
            expect(await oracle.getPrice()).to.equal(BigNumber.from("6894492"));
        });
    });

});
