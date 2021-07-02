require('dotenv').config()

const Provider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const request = require('request-promise');

const from = process.env.FROM_ADDRESS
const privateKey = process.env.WALLET_ADDRESS

const UniswapPairOracle = require('../deployments/abi/UniswapPairOracle.json')
const UniswapPairOracle_ARTH_ARTHX = new web3.eth.Contract(UniswapPairOracle, '0x69f99Fa4514A4c284A07466cf384515dec90e06C')
const UniswapPairOracle_ARTH_MAHA = new web3.eth.Contract(UniswapPairOracle, '0x45Fc4e11f28918F09ce45e744E85B85822643d18')
const UniswapPairOracle_ARTH_USDC = new web3.eth.Contract(UniswapPairOracle, '0x5f97c9bc6db3E8171B83DB4d142F7411147F2249')


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

        console.log('updating UniswapPairOracle_ARTH_MAHA oracle')
        const receipt1 = await UniswapPairOracle_ARTH_MAHA.methods.update().send(await getSendParams())
        console.log('UniswapPairOracle_ARTH_MAHA updated; tx hash', receipt1.transactionHash)

        console.log('updating UniswapPairOracle_ARTH_ARTHX oracle')
        const receipt1 = await UniswapPairOracle_ARTH_ARTHX.methods.update().send(await getSendParams())
        console.log('UniswapPairOracle_ARTH_ARTHX updated; tx hash', receipt1.transactionHash)

        console.log('updating UniswapPairOracle_ARTH_USDC oracle')
        const receipt1 = await UniswapPairOracle_ARTH_USDC.methods.update().send(await getSendParams())
        console.log('UniswapPairOracle_ARTH_USDC updated; tx hash', receipt1.transactionHash)

    } catch (e) {
        console.log('BondRedemtionOracle tx filed; nvm', e)
    }
}