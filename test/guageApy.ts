import { 
    polygonProvider, 
    ethRinkebyProvider, 
    ethGoerliProvider, 
    bscProvider, 
    polygonTestnetProvider, 
    ethProvider 
} from "../src/web3";
import { ethers, BigNumber } from "ethers";

const request = require('request-promise')

const CurveARTHfToken = require("./curveToken.json")

const arthfToken = new ethers.Contract(
    "0xbCCEb5b710E3eB07d1AC6a079e87D799bE30A71f",
    CurveARTHfToken,
    ethProvider
)

const options = (method, url) => {
    return {
        method: method,
        uri: url,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin':'*'
        },
        json: true
    }
}

const main = async () => {
    const data = await request(options('GET', 'https://api.curve.fi/api/getFactoryCryptoPools'))
    const usdVolumeCRV = data.data.poolData[142]

    console.log(usdVolumeCRV.usdTotal);

    const totalSupply = Number(await arthfToken.totalSupply() / 1e18)
    console.log("totalSupply", totalSupply);
    
    let lpTokenPrice = usdVolumeCRV.usdTotal / totalSupply
    console.log("LP token Price", lpTokenPrice);
    
}

main()