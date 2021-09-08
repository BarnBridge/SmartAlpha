import { ERC20Mock, OwnableERC20, PoolFactory, SmartAlpha } from "../typechain";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { deployContract } from "./helpers/deploy";
import { expect } from "chai";
import { contractAt, zeroAddress } from "./helpers/helpers";

describe("PoolFactory", () => {
    let snapshotId: any;

    let factory: PoolFactory;
    let poolToken: ERC20Mock;
    let deployer: Signer, happyPirate: Signer, flyingParrot: Signer;
    let deployerAddress: string, happyPirateAddress: string, flyingParrotAddress: string;

    before(async function () {
        [deployer, happyPirate, flyingParrot] = await ethers.getSigners();
        deployerAddress = await deployer.getAddress();
        happyPirateAddress = await happyPirate.getAddress();
        flyingParrotAddress = await flyingParrot.getAddress();

        poolToken = (await deployContract("ERC20Mock", ["Test token", "TST", 18])) as ERC20Mock;
        factory = (await deployContract("PoolFactory", [deployerAddress])) as PoolFactory;
    });

    beforeEach(async function () {
        snapshotId = await ethers.provider.send("evm_snapshot", []);
    });

    afterEach(async function () {
        await ethers.provider.send("evm_revert", [snapshotId]);
    });

    describe("deploy pool", () => {
        it("reverts if not called by owner", async () => {
            await expect(
                factory.connect(happyPirate).deploy(
                    happyPirateAddress,
                    flyingParrotAddress,
                    poolToken.address,
                    "0x9326BFA02ADD2366b30bacB125260Af641031331",
                    "Junior token",
                    "jTST",
                    "Senior token",
                    "sTST",
                    12312,
                    123123,
                    false,
                ),
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("can deploy pool", async () => {
            await expect(factory.connect(deployer).deploy(
                happyPirateAddress,
                flyingParrotAddress,
                poolToken.address,
                "0x9326BFA02ADD2366b30bacB125260Af641031331",
                "Junior token",
                "jTST",
                "Senior token",
                "sTST",
                12312,
                123123,
                false,
            )).to.not.be.reverted;

            const pool = await factory.pools(0);

            expect(pool.smartAlpha).to.not.equal(zeroAddress);

            const sa = (await contractAt("SmartAlpha", pool.smartAlpha)) as SmartAlpha;
            expect(await sa.dao()).to.equal(happyPirateAddress);
            expect(await sa.guardian()).to.equal(flyingParrotAddress);
            expect(await sa.juniorToken()).to.equal(pool.juniorToken);
            expect(await sa.seniorToken()).to.equal(pool.seniorToken);

            const jToken = (await contractAt("OwnableERC20", pool.juniorToken)) as OwnableERC20;
            expect(await jToken.decimals()).to.equal(18);

            const sToken = (await contractAt("OwnableERC20", pool.seniorToken)) as OwnableERC20;
            expect(await sToken.decimals()).to.equal(18);
        });

        it("can deploy pool with reverse chainlink oracle", async () => {
            await expect(factory.connect(deployer).deploy(
                happyPirateAddress,
                flyingParrotAddress,
                poolToken.address,
                "0x9326BFA02ADD2366b30bacB125260Af641031331",
                "Junior token",
                "jTST",
                "Senior token",
                "sTST",
                12312,
                123123,
                true
            )).to.not.be.reverted;

            const pool = await factory.pools(0);

            expect(pool.smartAlpha).to.not.equal(zeroAddress);

            const sa = (await contractAt("SmartAlpha", pool.smartAlpha)) as SmartAlpha;
            expect(await sa.dao()).to.equal(happyPirateAddress);
            expect(await sa.guardian()).to.equal(flyingParrotAddress);
            expect(await sa.juniorToken()).to.equal(pool.juniorToken);
            expect(await sa.seniorToken()).to.equal(pool.seniorToken);

            const jToken = (await contractAt("OwnableERC20", pool.juniorToken)) as OwnableERC20;
            expect(await jToken.decimals()).to.equal(18);

            const sToken = (await contractAt("OwnableERC20", pool.seniorToken)) as OwnableERC20;
            expect(await sToken.decimals()).to.equal(18);
        });


        it("sets jtoken & stoken decimals correctly", async () => {
            const poolToken1 = await deployContract("ERC20Mock", ["Test token", "TST", 8]);

            await expect(factory.connect(deployer).deploy(
                happyPirateAddress,
                flyingParrotAddress,
                poolToken1.address,
                "0x9326BFA02ADD2366b30bacB125260Af641031331",
                "Junior token",
                "jTST",
                "Senior token",
                "sTST",
                12312,
                123123,
                false
            )).to.not.be.reverted;

            const pool = await factory.pools(0);

            expect(pool.smartAlpha).to.not.equal(zeroAddress);

            const jToken = (await contractAt("OwnableERC20", pool.juniorToken)) as OwnableERC20;
            expect(await jToken.decimals()).to.equal(8);

            const sToken = (await contractAt("OwnableERC20", pool.seniorToken)) as OwnableERC20;
            expect(await sToken.decimals()).to.equal(8);
        });
    });
});
