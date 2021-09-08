import { BigNumber, BigNumberish } from "ethers";
import { tenPow18 } from "./helpers";

export function calcJuniorProfits (cP: BigNumberish, eP: BigNumberish, upR: BigNumber, totalSeniors: BigNumber): BigNumber {
    cP = BigNumber.from(cP);
    eP = BigNumber.from(eP);
    return cP.sub(eP).mul(tenPow18.sub(upR)).mul(totalSeniors).div(cP).div(tenPow18);
}

export function calcSeniorProfits (cP: BigNumberish, eP: BigNumberish, dR: BigNumber, totalSeniors: BigNumber): BigNumber {
    //((sBOND.principal * sBOND.ep) / calc_price) - principal
    cP = BigNumber.from(cP);
    eP = BigNumber.from(eP);

    const minPrice = eP.mul(tenPow18.sub(dR)).div(tenPow18).add(1);

    let calcPrice = cP;
    if (cP.lt(minPrice)) {
        calcPrice = minPrice;
    }

    return totalSeniors.mul(eP).div(calcPrice).sub(totalSeniors);
}
