import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ERC20, PoolFactory, SmartAlpha } from "../typechain";
import * as time from "../test/helpers/time";
import { settings } from "../settings/settings";
import { BigNumber } from "ethers";
import { formatEther } from "ethers/lib/utils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { ethers, deployments, getNamedAccounts } = hre;
    const { deploy, save } = deployments;
    const { deployer } = await getNamedAccounts();

    const cfg = settings(hre.network.name);

    console.log(`Will deploy ${cfg.pools.length} pools ...`);

    const factory = await ethers.getContract("PoolFactory") as PoolFactory;
    const poolArtifact = await deployments.getExtendedArtifact("SmartAlpha");

    for (const pool of cfg.pools) {
        let poolAddress;
        const oldDeployment = await deployments.getOrNull(pool.poolName);
        if (!oldDeployment) {
            const juniorTokenName = `BarnBridge ${pool.poolName} junior token`;
            const juniorTokenSymbol = `junior_${pool.poolName}`;
            const seniorTokenName = `BarnBridge ${pool.poolName} senior token`;
            const seniorTokenSymbol = `senior_${pool.poolName}`;

            const tx = await factory.deploy(
                cfg.daoAddress,
                cfg.guardianAddress,
                pool.poolToken,
                pool.chainlinkAggregator,
                juniorTokenName,
                juniorTokenSymbol,
                seniorTokenName,
                seniorTokenSymbol,
                Math.floor(pool.epoch1Start / 1000),
                pool.epochDuration,
                pool.chainlinkOracleReverse,
            );

            const receipt = await tx.wait(2);

            const nr = await factory.numberOfPools();
            const p = await factory.pools(nr.sub(1));

            save(pool.poolName, {
                abi: poolArtifact.abi,
                address: p.smartAlpha,
                bytecode: poolArtifact.bytecode,
                args: [factory.address, cfg.guardianAddress],
                transactionHash: tx.hash,
                metadata: poolArtifact.metadata,
            });

            const token = (await ethers.getContractAt("ERC20", pool.poolToken)) as ERC20;

            console.log(`
{
  "poolName": "${pool.poolName}",
  "poolAddress": "${p.smartAlpha}",
  "poolToken": {
    "address": "${pool.poolToken}",
    "symbol": "${await token.symbol()}",
    "decimals": ${await token.decimals()}
  },
  "juniorTokenAddress": "${p.juniorToken}",
  "juniorTokenSymbol" : "${juniorTokenSymbol}",
  "seniorTokenAddress": "${p.seniorToken}",
  "seniorTokenSymbol": "${seniorTokenSymbol}",
  "oracleAddress": "${p.oracle}",
  "oracleAssetSymbol": "${pool.oracleAsset}",
  "seniorRateModelAddress":"${p.seniorRateModel}",
  "accountingModelAddress":"${p.accountingModel}",
  "epoch1Start": ${Math.floor(pool.epoch1Start / 1000)},
  "epochDuration": ${pool.epochDuration},
  "startAtBlock": ${receipt.blockNumber}
},
        `);

            poolAddress = p.smartAlpha;

        } else {
            console.info(`${pool.poolName}: already deployed at ${oldDeployment.address}`);
            poolAddress = oldDeployment.address;
        }

        const poolContract = (await ethers.getContractAt("SmartAlpha", poolAddress)) as SmartAlpha;

        // set fees owner
        const currentFeesOwner: string = await poolContract.feesOwner();
        if (currentFeesOwner !== cfg.feesOwner) {
            console.info(`${pool.poolName}: fees owner set to ${currentFeesOwner}, setting to ${cfg.feesOwner}`);
            const feesOwnerTx = await poolContract.setFeesOwner(cfg.feesOwner);
            await feesOwnerTx.wait();
        } else {
            console.info(`${pool.poolName}: fees owner already set to ${currentFeesOwner}`);
        }

        // set fees
        const currentFees: BigNumber = await poolContract.feesPercentage();
        if (!currentFees.eq(cfg.feesPercent)) {
            console.info(`${pool.poolName}: fees set to ${formatEther(currentFees)}, setting to ${formatEther(cfg.feesPercent)}`);
            const feesTx = await poolContract.setFeesPercentage(cfg.feesPercent);
            await feesTx.wait();
        } else {
            console.info(`${pool.poolName}: fees already set to ${formatEther(currentFees)}`);
        }

        // set dao
        const currentDao: string = await poolContract.dao();
        if (currentDao !== cfg.daoAddress) {
            console.info(`${pool.poolName}: dao set to ${currentDao}, setting to ${cfg.daoAddress}`);
            const daoTx = await poolContract.transferDAO(cfg.daoAddress);
            await daoTx.wait();
        } else {
            console.info(`${pool.poolName}: dao already set to ${currentDao}`);
        }
    }

    console.log("Done");
};
export default func;
func.tags = ["SmartAlphaPools"];
