import { ethers } from "hardhat";
import { BigNumber, Contract } from "ethers";

export const zeroAddress = "0x0000000000000000000000000000000000000000";
export const tenPow18 = BigNumber.from(10).pow(18);
export const tenPow8 = BigNumber.from(10).pow(8);

export async function getLatestBlock (): Promise<any> {
    return await ethers.provider.send("eth_getBlockByNumber", ["latest", false]);
}

export async function getLatestBlockTimestamp (): Promise<number> {
    return parseInt((await getLatestBlock()).timestamp);
}

export async function setNextBlockTimestamp (timestamp: number): Promise<void> {
    const block = await ethers.provider.send("eth_getBlockByNumber", ["latest", false]);
    const currentTs = parseInt(block.timestamp);
    const diff = timestamp - currentTs;
    await ethers.provider.send("evm_increaseTime", [diff]);
}

export async function moveAtTimestamp (timestamp: number): Promise<void> {
    await setNextBlockTimestamp(timestamp);
    await ethers.provider.send("evm_mine", []);
}

export async function contractAt (name: string, address: string): Promise<Contract> {
    return await ethers.getContractAt(name, address);
}

export function scaleBN (n: BigNumber, decimals: number): number {
    const tenPowDec = BigNumber.from(10).pow(decimals - 4);

    return n.div(tenPowDec).toNumber() / 10000;
}

export function printPercentage (n: BigNumber, decimals: number): string {
    return (scaleBN(n, decimals) * 100).toFixed(2) + "%";
}

export function e8 (n: number): BigNumber {
    return tenPow8.mul(n);
}

export function e18 (n: number): BigNumber {
    return tenPow18.mul(n);
}
