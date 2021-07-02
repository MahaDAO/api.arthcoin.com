require('dotenv').config()

const Provider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const request = require('request-promise');

const from = process.env.FROM_ADDRESS
const privateKey = process.env.WALLET_ADDRESS

const UniswapPairOracle = require('../deployments/abi/UniswapPairOracle.json')
const UniswapPairOracle_ARTH_ARTHX = new web3.eth.Contract(UniswapPairOracle, '0x8fce074b01040805aEeBCa13a9b2500316321A18')
const UniswapPairOracle_MAHA_ARTH = new web3.eth.Contract(UniswapPairOracle, '0x8fce074b01040805aEeBCa13a9b2500316321A18')

export const updateOracles = async () => {
    const provider = new Provider(privateKey, 'https://rpc-mainnet.matic.quiknode.pro');
    const web3 = new Web3(provider);

    const getSendParams = async (nonceBump = 0) => {
        return {
            from,
            nonce: await web3.eth.getTransactionCount(from) + nonceBump,
            gasPrice: await web3.eth.getGasPrice()
        }
    }

    try {

        console.log('updating UniswapPairOracle_MAHA_ARTH oracle')
        const receipt1 = await UniswapPairOracle_MAHA_ARTH.methods.update().send(await getSendParams())
        console.log('UniswapPairOracle_MAHA_ARTH updated; tx hash', receipt1.transactionHash)

        console.log('updating UniswapPairOracle_ARTH_ARTHX oracle')
        const receipt1 = await UniswapPairOracle_ARTH_ARTHX.methods.update().send(await getSendParams())
        console.log('UniswapPairOracle_ARTH_ARTHX updated; tx hash', receipt1.transactionHash)

    } catch (e) {
        console.log('BondRedemtionOracle tx filed; nvm', e)
    }
}