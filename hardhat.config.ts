const dotenv = require('dotenv')
dotenv.config()

import "@nomiclabs/hardhat-ethers";

const ALCHEMY_URL = process.env.ALCHEMY_URL
console.log(ALCHEMY_URL);

const CHAIN_IDS = {
    hardhat: 31337, // chain ID for hardhat testing
};

module.exports = {
    networks: {
        hardhat: {
            chainId: CHAIN_IDS.hardhat,
            forking: {
                // Using Alchemy
                url: ALCHEMY_URL, // url to RPC node, ${ALCHEMY_KEY} - must be your API key
                // Using Infura
                // url: `https://mainnet.infura.io/v3/${INFURA_KEY}`, // ${INFURA_KEY} - must be your API key
                // blockNumber: 15967681, // a specific block number with which you want to work
            },
        },
    }
}