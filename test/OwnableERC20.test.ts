import { ethers } from "hardhat";
import { expect } from "chai";
import { getLatestBlockTimestamp, moveAtTimestamp, tenPow18 } from "./helpers/helpers";
import { deployContract } from "./helpers/deploy";
import { OwnableERC20 } from "../typechain";
import { BigNumber, Signer } from "ethers";

describe("OwnableERC20", () => {
    let snapshotId: any;
    let token: OwnableERC20;
    let owner: Signer, happyPirate: Signer;
    let ownerAddress: string, happyPirateAddress: string;
    const amount: BigNumber = BigNumber.from(100).mul(tenPow18);


    before(async function () {
        [owner, happyPirate] = await ethers.getSigners();
        ownerAddress = await owner.getAddress();
        happyPirateAddress = await happyPirate.getAddress();

        token = (await deployContract("OwnableERC20", ["Test ownable token", "TST", 18])) as OwnableERC20;
    });

    beforeEach(async function () {
        snapshotId = await ethers.provider.send("evm_snapshot", []);
    });

    afterEach(async function () {
        const ts = await getLatestBlockTimestamp();

        await ethers.provider.send("evm_revert", [snapshotId]);

        await moveAtTimestamp(ts + 5);
    });

    describe("General tests", () => {
        it("should be deployed", async () => {
            expect(token.address).to.not.equal(0);
        });

        it("sets the correct owner", async () => {
            expect(await token.owner()).to.equal(ownerAddress);
        });

        it("owner can mint tokens", async () => {
            await expect(token.connect(happyPirate).mint(happyPirateAddress, amount))
                .to.be.revertedWith("caller is not the owner");

            await expect(token.connect(owner).mint(happyPirateAddress, amount))
                .to.not.be.reverted;

            expect(await token.balanceOf(happyPirateAddress)).to.equal(amount);
        });

        it("owner can burn tokens", async () => {
            await expect(token.connect(owner).mint(happyPirateAddress, amount))
                .to.not.be.reverted;
            expect(await token.balanceOf(happyPirateAddress)).to.equal(amount);

            await expect(token.connect(happyPirate).burn(happyPirateAddress, amount))
                .to.be.revertedWith("caller is not the owner");

            await expect(token.connect(owner).burn(happyPirateAddress, amount))
                .to.not.be.reverted;
            expect(await token.balanceOf(happyPirateAddress)).to.equal(0);
        });

        it("owner can transfer without allowance", async () => {
            await token.connect(owner).mint(happyPirateAddress, amount);

            await expect(
                token.connect(happyPirate)
                    .transferAsOwner(happyPirateAddress, ownerAddress, amount),
            ).to.be.revertedWith("caller is not the owner");

            await expect(
                token.connect(owner)
                    .transferAsOwner(happyPirateAddress, ownerAddress, amount),
            ).to.not.be.reverted;

            expect(await token.balanceOf(happyPirateAddress)).to.equal(0);
            expect(await token.balanceOf(ownerAddress)).to.equal(amount);
        });

        it("sets the correct decimals", async () => {
            const t1 = (await deployContract("OwnableERC20", ["Test", "TST1", 18])) as OwnableERC20;
            expect(await t1.decimals()).to.equal(18);

            const t2 = (await deployContract("OwnableERC20", ["Test", "TST2", 8])) as OwnableERC20;
            expect(await t2.decimals()).to.equal(8);
        });
    });
});
