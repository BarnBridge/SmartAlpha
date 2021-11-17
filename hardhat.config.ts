import { HardhatUserConfig, task } from "hardhat/config";
import * as config from "./config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-abi-exporter";
import "solidity-coverage";
import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-solhint";
import "hardhat-contract-sizer";
import "hardhat-deploy";

// This is a sample Buidler task. To learn how to create your own go to
// https://buidler.dev/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(await account.getAddress());
    }
});

task("verify-epoch-advancer", "verifies", async (args, hre) => {
    await hre.run("verify:verify", {
        address: "0xa899Eeb62ada17e7C0A2799865Ec668111e81dd1",
        constructorArguments: [
            [
                "0x31f7da25361ad99ca4daa4e8709624660f324f48",
                "0x13d5387389ac1a3b72391d88b03b893a945b17cd",
                "0xe4fbc5a705aab5a094fc3961dfc764716f041ee9",
                "0xb0105f829d50841b949c274636c2d173a78db7e0",
            ],
        ],
    });
});

// Some of the settings should be defined in `./config.js`.
// Go to https://hardhat.org/config/ for the syntax.
const cfg: HardhatUserConfig = {
    solidity: {
        version: "0.8.6",
        settings: {
            optimizer: {
                enabled: true,
                runs: 2,
            },
        },
    },

    namedAccounts: {
        deployer: 0,
    },

    defaultNetwork: "hardhat",

    networks: config.networks,
    etherscan: config.etherscan,

    abiExporter: {
        only: ["SmartAlpha"],
        except: [".*Mock$"],
        clear: true,
        flat: true,
    },

    gasReporter: {
        enabled: (process.env.REPORT_GAS) ? true : false,
    },

    contractSizer: {
        alphaSort: true,
        runOnCompile: false,
        disambiguatePaths: false,
    },
};

export default cfg;
