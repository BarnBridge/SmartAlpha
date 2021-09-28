import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ERC20, PoolFactory } from "../typechain";
import * as time from "../test/helpers/time";
import { settings } from "../settings";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const cfg = settings(hre.network.name);


  // https://docs.chain.link/docs/avalanche-price-feeds/#Avalanche%20Testnet
  const pools = [
    {
      poolName: "WETH-USD-30m",
      oracleAsset: "USD",
      dao: cfg.daoAddress,
      guardian: cfg.guardianAddress,
      poolToken: "0x7fcdc2c1ef3e4a0bcc8155a558bb20a7218f2b05",
      chainlinkAggregator: "0x86d67c3D38D2bCeE722E601025C25a575021c6EA",
      chainlinkOracleReverse: false,
      epoch1Start: Date.UTC(2021, 9, 1, 14),
      epochDuration: 30 * time.minute,
    },
  ];


  console.log(`Will deploy ${pools.length} pools ...`);

  const factory = await ethers.getContract("PoolFactory") as PoolFactory;

  for (const pool of pools) {
    const juniorTokenName = `BarnBridge ${pool.poolName} junior token`;
    const juniorTokenSymbol = `junior_${pool.poolName}`;
    const seniorTokenName = `BarnBridge ${pool.poolName} senior token`;
    const seniorTokenSymbol = `senior_${pool.poolName}`;

    const tx = await factory.deploy(
      pool.dao,
      pool.guardian,
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

    await tx.wait(2);

    const nr = await factory.numberOfPools();
    const p = await factory.pools(nr.sub(1));

    const token = (await ethers.getContractAt("ERC20", pool.poolToken, )) as ERC20;

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
  "startAtBlock": ${tx.blockNumber}
},
        `);
  }

  console.log("Done");

  // await deploy('SmartAlphaLoupe', {
  //   from: deployer,
  //   args: [],
  //   log: true,
  // });
};
export default func;
func.tags = ['SmartAlphaPools'];