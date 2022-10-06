import {
    getCollateralPrices,
    CollateralKeys,
    ICollateralPrices,
} from "../src/controller/coingecko";

const main = async () => {
    const collateralPrices = await getCollateralPrices();
    let sclpPrice = collateralPrices["SCLP"]
    let mahaPrice = collateralPrices["MAHA"]

    let amountofMaha = (sclpPrice * 9000) / mahaPrice
    console.log(amountofMaha);
}

main()