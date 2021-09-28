import { HardhatRuntimeEnvironment } from "hardhat/types";

interface SettingsInterface {
  [key: string]: Settings;
}

interface Settings {
  daoAddress: string,
  guardianAddress: string,
  extra: any,
}

export function settings(networkName: string): Settings {
  const cfg = {
    "hardhat": {
      daoAddress: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
      guardianAddress: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
      extra: null
    },
    "matic": {
      daoAddress: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
      guardianAddress: "0x558Ef269Bcc4cc9F2e14E3f4301231fbeb85d95F",
      extra: null
    },
    "fuji": {
      daoAddress: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
      guardianAddress: "0xB011D306D36c396847bA42b1c7AEb8E96C540d9a",
      extra: null
    },
  } as SettingsInterface;

  return cfg[networkName];
}
