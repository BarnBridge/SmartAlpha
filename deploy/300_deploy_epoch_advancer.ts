import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { settings } from "../settings/settings";
import { deployContract } from "../test/helpers/deploy";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const cfg = settings(hre.network.name);

    const pools = [];
    for (const pool of cfg.pools) {
        const deployment = await deployments.getOrNull(pool.poolName);
        if (deployment) {
            pools.push(deployment.address);
        }
    }

    // if the pools are already created but the advancer is not, we add all the existing pools
    await deploy("EpochAdvancer", {
        skipIfAlreadyDeployed: true,
        from: deployer,
        args: [pools],
        log: true,
        waitConfirmations: 5,
    });
};
export default func;
func.tags = ["EpochAdvancer"];
