require('dotenv').config()

const Provider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const web3 = new Web3('https://apis.ankr.com/0aa7b5a6761f4b87ae97c6b718d900ff/0a39ba8bf2c40d99b20fea4372ebaa68/polygon/full/main')

const from = process.env.FROM_ADDRESS;
const privateKey = process.env.WALLET_ADDRESS;

const UniswapPairOracle = require('./deployments/abi/UniswapPairOracle.json')
const UniswapPairOracle_ARTH_ARTHX = new web3.eth.Contract(UniswapPairOracle, '0x23b8603CB7d8395754E20e272e0e2fFFA2828654')
const UniswapPairOracle_ARTH_MAHA = new web3.eth.Contract(UniswapPairOracle, '0xFC645E3c39e257d634bBea9637a4c7f326eB4B50')
const UniswapPairOracle_ARTH_USDC = new web3.eth.Contract(UniswapPairOracle, '0x7F4f57b81c1134eFC6c0FB7B51FDF50eEb6afdbc')


export const updateOracles = async () => {
    const provider = new Provider(privateKey, 'https://rpc-mainnet.matic.quiknode.pro');
    const web3 = new Web3(provider);

    const getSendParams = async (nonceBump = 0) => {
        return {
            from,
            nonce: await web3.eth.getTransactionCount(from) + nonceBump,
            gasPrice: await web3.eth.getGasPrice()
        };
    };

    try {

        console.log('updating UniswapPairOracle_ARTH_MAHA oracle')
        const receipt1 = await UniswapPairOracle_ARTH_MAHA.methods.update().send(await getSendParams())
        console.log('UniswapPairOracle_ARTH_MAHA updated; tx hash', receipt1.transactionHash)

        console.log('updating UniswapPairOracle_ARTH_ARTHX oracle')
        const receipt2 = await UniswapPairOracle_ARTH_ARTHX.methods.update().send(await getSendParams())
        console.log('UniswapPairOracle_ARTH_ARTHX updated; tx hash', receipt2.transactionHash)

        console.log('updating UniswapPairOracle_ARTH_USDC oracle')
        const receipt3 = await UniswapPairOracle_ARTH_USDC.methods.update().send(await getSendParams())
        console.log('UniswapPairOracle_ARTH_USDC updated; tx hash', receipt3.transactionHash)

    } catch (e) {
        console.log('BondRedemtionOracle tx filed; nvm', e)
    }
}
