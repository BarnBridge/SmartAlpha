import { contractAt, tenPow18, tenPow8 } from "../test/helpers/helpers";
import { ERC20Test } from "../typechain";

// const _token = "0x13690071c13573d2be241a6c188c8387818a626f"; // weth
const _token = "0xc802b80db38729f272d704f7f32194cc91e6476b"; // wbtc
const scale = tenPow8;

async function main () {
    const token = (await contractAt("ERC20Test", _token)) as ERC20Test;

    await token.mint("0xbbbbbbf2e986c085bf79d44bacfa791c92b71fe8", scale.mul(1000000));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
