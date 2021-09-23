import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { settings } from "../settings";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  const cfg = settings(hre.network.name);

  await deploy('PoolFactory', {
    from: deployer,
    args: [cfg.daoAddress],
    log: true,
  });
};
export default func;
func.tags = ['PoolFactory'];