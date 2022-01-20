import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { EpochAdvancer, ERC20, PoolFactory, SmartAlpha } from "../typechain";
import * as time from "../test/helpers/time";
import { settings } from "../settings/settings";
import { BigNumber } from "ethers";
import { formatEther } from "ethers/lib/utils";
import { ExtendedArtifact } from "hardhat-deploy/dist/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { ethers, deployments, getNamedAccounts } = hre;
    const { deploy, save } = deployments;
    const { deployer } = await getNamedAccounts();

    const cfg = settings(hre.network.name);

    console.log(`Will deploy ${cfg.pools.length} pools ...`);

    const factory = await ethers.getContract("PoolFactory") as PoolFactory;
    const poolArtifact = await deployments.getExtendedArtifact("SmartAlpha");
    const rateModelArtifact = await deployments.getExtendedArtifact("SeniorRateModelV3");
    const accountingModelArtifact = await deployments.getExtendedArtifact("AccountingModel");
    const oracleArtifact = await deployments.getExtendedArtifact("ChainlinkOracle");
    const oracleReverseArtifact = await deployments.getExtendedArtifact("ChainlinkOracleReverse");
    const tokenArtifact = await deployments.getExtendedArtifact("OwnableERC20");

    const advancerPools = [];

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

            const receipt = await tx.wait(10);

            const nr = await factory.numberOfPools();
            const p = await factory.pools(nr.sub(1));

            const token = (await ethers.getContractAt("ERC20", pool.poolToken)) as ERC20;
            const tokenDecimals = await token.decimals();

            // save deployments info
            await saveDeployment(
                save,
                pool.poolName,
                p.smartAlpha,
                [factory.address, cfg.guardianAddress],
                poolArtifact,
            );

            await saveDeployment(
                save,
                pool.poolName + "-AccountingModel",
                p.accountingModel,
                [],
                accountingModelArtifact,
            );

            await saveDeployment(
                save,
                pool.poolName + "-SeniorRateModel",
                p.seniorRateModel,
                [],
                rateModelArtifact,
            );

            let cloa = oracleArtifact;
            if (pool.chainlinkOracleReverse) {
                cloa = oracleReverseArtifact;
            }

            await saveDeployment(
                save,
                pool.poolName + "-Oracle",
                p.oracle,
                [pool.chainlinkAggregator],
                cloa,
            );

            await saveDeployment(
                save,
                pool.poolName + "-Junior",
                p.juniorToken,
                [juniorTokenName, juniorTokenSymbol, tokenDecimals],
                tokenArtifact,
            );
            await saveDeployment(
                save,
                pool.poolName + "-Senior",
                p.seniorToken,
                [seniorTokenName, seniorTokenSymbol, tokenDecimals],
                tokenArtifact,
            );

            // add to epoch advancer
            advancerPools.push(p.smartAlpha);

            // output info
            console.log(`
{
  "poolName": "${pool.poolName}",
  "poolAddress": "${p.smartAlpha}",
  "poolToken": {
    "address": "${pool.poolToken}",
    "symbol": "${await token.symbol()}",
    "decimals": ${tokenDecimals}
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

        // updating settings
        const poolContract = (await ethers.getContractAt("SmartAlpha", poolAddress)) as SmartAlpha;

        // set fees owner
        const currentFeesOwner: string = await poolContract.feesOwner();
        if (currentFeesOwner !== cfg.feesOwner) {
            console.info(`${pool.poolName}: fees owner set to ${currentFeesOwner}, setting to ${cfg.feesOwner}`);
            const feesOwnerTx = await poolContract.setFeesOwner(cfg.feesOwner);
            await feesOwnerTx.wait(10);
        } else {
            console.info(`${pool.poolName}: fees owner already set to ${currentFeesOwner}`);
        }

        // set fees
        const currentFees: BigNumber = await poolContract.feesPercentage();
        if (!currentFees.eq(cfg.feesPercent)) {
            console.info(`${pool.poolName}: fees set to ${formatEther(currentFees)}, setting to ${formatEther(cfg.feesPercent)}`);
            const feesTx = await poolContract.setFeesPercentage(cfg.feesPercent);
            await feesTx.wait(10);
        } else {
            console.info(`${pool.poolName}: fees already set to ${formatEther(currentFees)}`);
        }

        // set dao
        const currentDao: string = await poolContract.dao();
        if (currentDao !== cfg.daoAddress) {
            console.info(`${pool.poolName}: dao set to ${currentDao}, setting to ${cfg.daoAddress}`);
            const daoTx = await poolContract.transferDAO(cfg.daoAddress);
            await daoTx.wait(10);
        } else {
            console.info(`${pool.poolName}: dao already set to ${currentDao}`);
        }
    }

    // add new pools to advancer
    if (advancerPools.length > 0) {
        console.log("adding pools to advancer", advancerPools);
        const advancer = (await ethers.getContract("EpochAdvancer")) as EpochAdvancer;
        const tx = await advancer.addPools(advancerPools);
        await tx.wait(10);
    }
    console.log("Done");
};
export default func;
func.tags = ["SmartAlphaPools"];

// TODO move this to somewhere better
const saveDeployment = async function (saveFn: any, name: string, address: string, args: any, artifact: ExtendedArtifact) {
    await saveFn(name, {
        abi: artifact.abi,
        address: address,
        bytecode: artifact.bytecode,
        deployedBytecode: artifact.deployedBytecode,
        args: args,
        metadata: artifact.metadata,
        solcInput: artifact.solcInput,
        solcInputHash: artifact.solcInputHash,
    });
};
