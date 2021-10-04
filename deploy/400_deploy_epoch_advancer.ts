import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { settings } from "../settings/settings";
import { deployContract } from "../test/helpers/deploy";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const cfg = settings(hre.network.name);
    // const advancer = await deployContract("EpochAdvancer", [[
    //     "0xd432fab68b922972b104854fcd22211f33be6ec2",
    //     "0x1545c4ccda7de57b6c3c3609c1c8ad6f9c431ba4",
    //     "0xc7898e159c72ea4d79810582f945fb194b6841fc",
    //     "0x592df0ee9f8ab5958bf04de48254a37503da74e0",
    // ]]);
    //

    const pools = [];
    for (const pool of cfg.pools) {
        const deployment = await deployments.getOrNull(pool.poolName);
        if (deployment) {
            pools.push(deployment.address);
        }
    }

    await deploy("EpochAdvancer", {
        skipIfAlreadyDeployed: true,
        from: deployer,
        args: [pools],
        log: true,
    });
};
export default func;
func.tags = ["EpochAdvancer"];
