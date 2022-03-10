const dotenv = require('dotenv');
dotenv.config();

import { polygonProvider, bscProvider, polygonTestnetProvider } from "./src/web3";
import { ethers, BigNumber } from "ethers";

const TroveManager = require("./src/abi/TroveManager.json")
const priceFeed = require("./src/abi/PriceFeed.json");

const main = async () => {
    try {
        // polygonTestnetProvider.getBlockNumber().then((result) => {
        //     console.log("Current block number: " + result);
        // });

        const troveManager = new ethers.Contract(
            "0xe5EfD185Bd7c288e270bA764E105f8964aAecd41",
            TroveManager, 
            polygonTestnetProvider
        );
        const collateralRaised:BigNumber = await troveManager.getEntireSystemColl();
        console.log(collateralRaised.div(8), typeof(collateralRaised));
        
        const wallet = new ethers.Wallet(
            process.env.WALLET_KEY,
            polygonTestnetProvider
        )

        const priceFeedContract = new ethers.Contract(
            "0x935c70e4B9371f63A598BdA58BF1B2b270C8eBFe",
            priceFeed, 
            wallet
        );
        
        const price = await priceFeedContract.callStatic.fetchPrice()
        console.log('price', price / 1e18);
        
    } catch (e) {
        console.log(e);
    }
}

main()