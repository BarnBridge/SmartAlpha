import { BigNumber } from "ethers";
import { expect } from "chai";

export function expectEqualWithDust (actual: BigNumber, expected: BigNumber, allowDust = BigNumber.from(100)): void {
    const diff = actual.sub(expected).abs();

    expect(
        diff.lt(allowDust),
        `Expected ${actual.toString()} to be equal to ${expected.toString()} within ${allowDust.toString()}`,
    ).to.be.true;
}
