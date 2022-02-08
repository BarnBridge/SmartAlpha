import { HardhatRuntimeEnvironment } from "hardhat/types";
import { tenPow18 } from "../test/helpers/helpers";
import { BigNumber } from "ethers";
import * as time from "../test/helpers/time";

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
const almostFivePercent = tenPow18.mul(5).div(100).sub(1);

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
            daoAddress: "0x0be4DD738E9818C7cB2C86dacEc1542EAc3B81B8",
            guardianAddress: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
            feesOwner: "0x0be4DD738E9818C7cB2C86dacEc1542EAc3B81B8",
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
        // https://docs.chain.link/docs/avalanche-price-feeds/#Avalanche%20Mainnet
        // https://github.com/pangolindex/tokenlists/blob/main/ab.tokenlist.json
        "avalanche": {
            daoAddress: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
            guardianAddress: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
            feesOwner: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
            feesPercent: almostFivePercent,
            pools: [
                {
                    poolName: "WETH-USD-1w",
                    oracleAsset: "USD",
                    poolToken: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",
                    chainlinkAggregator: "0x976B3D034E162d8bD72D6b9C989d545b839003b0",
                    chainlinkOracleReverse: false,
                    epoch1Start: Date.UTC(2021, 9, 4, 14),
                    epochDuration: 7 * time.day,
                },
                {
                    poolName: "WBTC-USD-1w",
                    oracleAsset: "USD",
                    poolToken: "0x50b7545627a5162F82A992c33b87aDc75187B218",
                    chainlinkAggregator: "0x2779D32d5166BAaa2B2b658333bA7e6Ec0C65743",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2021, 9, 4, 14),
                    epochDuration: 7 * time.day,
                },
                {
                    poolName: "WAVAX-USD-1w",
                    oracleAsset: "USD",
                    poolToken: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
                    chainlinkAggregator: "0x0A77230d17318075983913bC2145DB16C7366156",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2021, 9, 4, 14),
                    epochDuration: 7 * time.day,
                },
                {
                    poolName: "AAVE-USD-1w",
                    oracleAsset: "USD",
                    poolToken: "0x63a72806098Bd3D9520cC43356dD78afe5D386D9",
                    chainlinkAggregator: "0x3CA13391E9fb38a75330fb28f8cc2eB3D9ceceED",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2021, 9, 4, 14),
                    epochDuration: 7 * time.day,
                },
            ],
        },
        // https://docs.chain.link/docs/binance-smart-chain-addresses/#BSC%20Testnet
        "bsctestnet": {
            daoAddress: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
            guardianAddress: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
            feesOwner: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
            feesPercent: pointFivePercent,
            pools: [
                {
                    poolName: "WBNB-USD-30m",
                    oracleAsset: "USD",
                    poolToken: "0xae13d989dac2f0debff460ac112a837c89baa7cd",
                    chainlinkAggregator: "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2021, 9, 4, 14),
                    epochDuration: 30 * time.minute,
                },
            ],
        },
        // https://docs.chain.link/docs/binance-smart-chain-addresses/#BSC%20Mainnet
        // https://api.binance.org/bridge/api/v2/tokens
        "bsc": {
            daoAddress: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
            guardianAddress: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
            feesOwner: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
            feesPercent: almostFivePercent,
            pools: [
                {
                    poolName: "ETH-USD-1w",
                    oracleAsset: "USD",
                    poolToken: "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
                    chainlinkAggregator: "0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e",
                    chainlinkOracleReverse: false,
                    epoch1Start: Date.UTC(2021, 9, 11, 14),
                    epochDuration: 7 * time.day,
                },
                {
                    poolName: "BTCB-USD-1w",
                    oracleAsset: "USD",
                    poolToken: "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
                    chainlinkAggregator: "0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2021, 9, 11, 14),
                    epochDuration: 7 * time.day,
                },
                {
                    poolName: "WBNB-USD-1w",
                    oracleAsset: "USD",
                    poolToken: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
                    chainlinkAggregator: "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2021, 9, 11, 14),
                    epochDuration: 7 * time.day,
                },
                {
                    poolName: "CAKE-USD-1w",
                    oracleAsset: "USD",
                    poolToken: "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
                    chainlinkAggregator: "0xB6064eD41d4f67e353768aA239cA86f4F73665a1",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2021, 9, 11, 14),
                    epochDuration: 7 * time.day,
                },
                {
                    poolName: "FLOKI-USD-1w",
                    oracleAsset: "USD",
                    poolToken: "0x2b3f34e9d4b127797ce6244ea341a83733ddd6e4",
                    chainlinkAggregator: "0x19018Cb4e5228A433CA0469e11E04AD47679B97D",
                    chainlinkOracleReverse: false,
                    epoch1Start: Date.UTC(2021, 11, 27, 14),
                    epochDuration: 7 * time.day,
                },
            ],
        },
        // https://docs.chain.link/docs/arbitrum-price-feeds/#Arbitrum%20Rinkeby
        "arbitrumrinkeby": {
            daoAddress: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
            guardianAddress: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
            feesOwner: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
            feesPercent: pointFivePercent,
            pools: [
                {
                    poolName: "WETH-USD-30m",
                    oracleAsset: "USD",
                    poolToken: "0xb47e6a5f8b33b3f17603c83a0535a9dcd7e32681",
                    chainlinkAggregator: "0x5f0423B1a6935dc5596e7A24d98532b67A0AeFd8",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2021, 9, 13, 14),
                    epochDuration: 30 * time.minute,
                },
            ],
        },
        // https://docs.chain.link/docs/arbitrum-price-feeds/#Arbitrum%20Rinkeby
        "arbitrum": {
            daoAddress: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
            guardianAddress: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
            feesOwner: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
            feesPercent: almostFivePercent,
            pools: [
                {
                    poolName: "WETH-USD-1w",
                    oracleAsset: "USD",
                    poolToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
                    chainlinkAggregator: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
                    chainlinkOracleReverse: false,
                    epoch1Start: Date.UTC(2021, 9, 18, 14),
                    epochDuration: 7 * time.day,
                },
                {
                    poolName: "WBTC-USD-1w",
                    oracleAsset: "USD",
                    poolToken: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
                    chainlinkAggregator: "0x6ce185860a4963106506C203335A2910413708e9",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2021, 9, 18, 14),
                    epochDuration: 7 * time.day,
                },
                {
                    poolName: "UNI-USD-1w",
                    oracleAsset: "USD",
                    poolToken: "0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0",
                    chainlinkAggregator: "0x9C917083fDb403ab5ADbEC26Ee294f6EcAda2720",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2021, 9, 18, 14),
                    epochDuration: 7 * time.day,
                },
                {
                    poolName: "LINK-USD-1w",
                    oracleAsset: "USD",
                    poolToken: "0xf97f4df75117a78c1a5a0dbb814af92458539fb4",
                    chainlinkAggregator: "0x86E53CF1B870786351Da77A57575e79CB55812CB",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2021, 9, 18, 14),
                    epochDuration: 7 * time.day,
                },
                {
                    poolName: "SUSHI-USD-1w",
                    oracleAsset: "USD",
                    poolToken: "0xd4d42f0b6def4ce0383636770ef773390d85c61a",
                    chainlinkAggregator: "0xb2A8BA74cbca38508BA1632761b56C897060147C",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2021, 9, 18, 14),
                    epochDuration: 7 * time.day,
                },
            ],
        },
        // https://docs.chain.link/docs/optimism-price-feeds/#Optimism%20Kovan
        "optimistickovan": {
            daoAddress: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
            guardianAddress: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
            feesOwner: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
            feesPercent: pointFivePercent,
            pools: [
                {
                    poolName: "WETH-USD-30m",
                    oracleAsset: "USD",
                    poolToken: "0x4200000000000000000000000000000000000006",
                    chainlinkAggregator: "0xCb7895bDC70A1a1Dce69b689FD7e43A627475A06",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2021, 11, 9, 10),
                    epochDuration: 30 * time.minute,
                },
                {
                    poolName: "WETH-USD-1d",
                    oracleAsset: "USD",
                    poolToken: "0x4200000000000000000000000000000000000006",
                    chainlinkAggregator: "0xCb7895bDC70A1a1Dce69b689FD7e43A627475A06",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2022, 1, 4, 10),
                    epochDuration: time.day,
                },
                {
                    poolName: "LINK-USD-1d",
                    oracleAsset: "USD",
                    poolToken: "0x4911b761993b9c8c0d14ba2d86902af6b0074f5b",
                    chainlinkAggregator: "0xb37aA79EBc31B93864Bff2d5390b385bE482897b",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2022, 1, 8, 10),
                    epochDuration: time.day,
                },
            ],
        },
        // https://docs.chain.link/docs/optimism-price-feeds/#Optimism%20Mainnet
        "optimistic": {
            daoAddress: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
            guardianAddress: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
            feesOwner: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
            feesPercent: almostFivePercent,
            pools: [
                {
                    poolName: "WETH-USD-1w",
                    oracleAsset: "USD",
                    poolToken: "0x4200000000000000000000000000000000000006",
                    chainlinkAggregator: "0x13e3Ee699D1909E989722E753853AE30b17e08c5",
                    chainlinkOracleReverse: false,
                    epoch1Start: Date.UTC(2022, 0, 24, 14),
                    epochDuration: 7 * time.day,
                },
                {
                    poolName: "WBTC-USD-1w",
                    oracleAsset: "USD",
                    poolToken: "0x68f180fcce6836688e9084f035309e29bf0a2095",
                    chainlinkAggregator: "0xD702DD976Fb76Fffc2D3963D037dfDae5b04E593",
                    chainlinkOracleReverse: false,
                    epoch1Start: Date.UTC(2022, 0, 24, 14),
                    epochDuration: 7 * time.day,
                },
                {
                    poolName: "SNX-USD-1w",
                    oracleAsset: "USD",
                    poolToken: "0x8700daec35af8ff88c16bdf0418774cb3d7599b4",
                    chainlinkAggregator: "0x2FCF37343e916eAEd1f1DdaaF84458a359b53877",
                    chainlinkOracleReverse: false,
                    epoch1Start: Date.UTC(2022, 0, 24, 14),
                    epochDuration: 7 * time.day,
                },
                {
                    poolName: "LINK-USD-1w",
                    oracleAsset: "USD",
                    poolToken: "0x350a791bfc2c21f9ed5d10980dad2e2638ffa7f6",
                    chainlinkAggregator: "0xCc232dcFAAE6354cE191Bd574108c1aD03f86450",
                    chainlinkOracleReverse: false,
                    epoch1Start: Date.UTC(2022, 0, 24, 14),
                    epochDuration: time.day,
                },
                {
                    poolName: "WETH-USD-1d",
                    oracleAsset: "USD",
                    poolToken: "0x4200000000000000000000000000000000000006",
                    chainlinkAggregator: "0x13e3Ee699D1909E989722E753853AE30b17e08c5",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2022, 1, 8, 14),
                    epochDuration: time.day,
                },
                {
                    poolName: "WBTC-USD-1d",
                    oracleAsset: "USD",
                    poolToken: "0x68f180fcce6836688e9084f035309e29bf0a2095",
                    chainlinkAggregator: "0xD702DD976Fb76Fffc2D3963D037dfDae5b04E593",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2022, 1, 8, 14),
                    epochDuration: time.day,
                },
                {
                    poolName: "SNX-USD-1d",
                    oracleAsset: "USD",
                    poolToken: "0x8700daec35af8ff88c16bdf0418774cb3d7599b4",
                    chainlinkAggregator: "0x2FCF37343e916eAEd1f1DdaaF84458a359b53877",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2022, 1, 8, 14),
                    epochDuration: time.day,
                },
                {
                    poolName: "LINK-USD-1d",
                    oracleAsset: "USD",
                    poolToken: "0x350a791bfc2c21f9ed5d10980dad2e2638ffa7f6",
                    chainlinkAggregator: "0xCc232dcFAAE6354cE191Bd574108c1aD03f86450",
                    chainlinkOracleReverse: false,
                    epoch1Start:  Date.UTC(2022, 1, 8, 14),
                    epochDuration: time.day,
                },
            ],
        },
    } as SettingsInterface;

    return cfg[networkName];
}
