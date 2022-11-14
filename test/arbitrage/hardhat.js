const dotenv = require('dotenv')
dotenv.config()

const ALCHEMY_KEY = process.env.ALCHEMY_KEY
const CHAIN_IDS = {
    hardhat: 31337, // chain ID for hardhat testing
};

module.exports = {
    networks: {
        hardhat: {
        chainId: CHAIN_IDS.hardhat,
        forking: {
            // Using Alchemy
            url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`, // url to RPC node, ${ALCHEMY_KEY} - must be your API key
            // Using Infura
            // url: `https://mainnet.infura.io/v3/${INFURA_KEY}`, // ${INFURA_KEY} - must be your API key
            blockNumber: 15967681, // a specific block number with which you want to work
        },
        },
    }
}