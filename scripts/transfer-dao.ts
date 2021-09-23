import { contractAt, tenPow18 } from "../test/helpers/helpers";
import { SmartAlpha } from "../typechain";

const pools = [
    "0x0b2BCde6a404c53c05A6c0F5402daEd4f2dD5779",
    "0x4aB87E2e6C53c4ef437c73793e3029D76B258688",
    "0x21f768446a171f50A20C727E420981AD70e0E9d9",
    "0xeCa0ffc5E3566e9dAD05f206F2Ca1fF0174AF476",
];

const dao = "0x4cAE362D7F227e3d306f70ce4878E245563F3069";

async function main () {
    for (const p of pools) {
        const sa = (await contractAt("SmartAlpha", p)) as SmartAlpha;

        const tx = await sa.transferDAO(dao);
        await tx.wait(1);

        console.log(`Pool ${p} transferred DAO to ${dao}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
