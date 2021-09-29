import { HardhatRuntimeEnvironment } from "hardhat/types";
import { tenPow18 } from "../../test/helpers/helpers";
import { BigNumber } from "ethers";
import * as time from "../../test/helpers/time";

interface SettingsInterface {
    [key: string]: Settings;
}

interface Settings {
    daoAddress: string,
    guardianAddress: string,
    feesOwner: string,
    feesPercent: BigNumber,
    pools: PoolSettings[],
}

interface PoolSettings {
    poolName: string,
    oracleAsset: string,
    poolToken: string,
    chainlinkAggregator: string,
    chainlinkOracleReverse: boolean,
    epoch1Start: number,
    epochDuration: number,
}

const zeroPercent = BigNumber.from(0);
const pointFivePercent = tenPow18.mul(5).div(10).div(100);

export function settings (networkName: string): Settings {
    const cfg = {
        // "hardhat": {
        //     daoAddress: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
        //     guardianAddress: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
        //     feesOwner: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
        //     feesPercent: zeroPercent,
        // },
        "matic": {
            daoAddress: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
            guardianAddress: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
            feesOwner: "0x2D55369b2e04AFeFf55b56E782A7D9206DFFA591",
            feesPercent: pointFivePercent,
            pools: [],
        },
        // https://docs.chain.link/docs/avalanche-price-feeds/#Avalanche%20Testnet
        "fuji": {
            daoAddress: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
            guardianAddress: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
            feesOwner: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
            feesPercent: pointFivePercent,
            pools: [
                {
                    poolName: "WETH-USD-30m",
                    oracleAsset: "USD",
                    poolToken: "0x7fcdc2c1ef3e4a0bcc8155a558bb20a7218f2b05",
                    chainlinkAggregator: "0x86d67c3D38D2bCeE722E601025C25a575021c6EA",
                    chainlinkOracleReverse: false,
                    epoch1Start: Date.UTC(2021, 9, 1, 14),
                    epochDuration: 30 * time.minute,
                },
                {
                    poolName: "WBTC-USD-30m",
                    oracleAsset: "USD",
                    poolToken: "0xc4a8272248A5233aC3359D4BC100bC671EBdE4Cd",
                    chainlinkAggregator: "0x31CF013A08c6Ac228C94551d535d5BAfE19c602a",
                    chainlinkOracleReverse: false,
                    epoch1Start: Date.UTC(2021, 8, 29, 12),
                    epochDuration: 30 * time.minute,
                },
            ],
        },
    } as SettingsInterface;

    return cfg[networkName];
}
