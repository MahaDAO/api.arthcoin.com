require('dotenv').config();

const Provider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');

const from = process.env.FROM_ADDRESS;
const privateKey = process.env.WALLET_ADDRESS;
const rpc = process.env.RPC_URL;

const ABI = require('./deployments/abi/OracleUpdater.json');

export const updateOracles = async () => {
    const provider = new Provider(privateKey, rpc);
    const web3 = new Web3(provider);


    const instance = new web3.eth.Contract(ABI, '0x8E98466623E5Af52a7c06045eB1ebE074A2d1eD6');

    const getSendParams = async (nonceBump = 0) => {
        return {
            from,
            nonce: await web3.eth.getTransactionCount(from) + nonceBump,
            gasPrice: await web3.eth.getGasPrice()
        };
    };

    try {
        console.log('updating oracles');
        const receipt1 = await instance.methods.update().send(await getSendParams());
        console.log('oracles updated; tx hash', receipt1.transactionHash);

    } catch (e) {
        console.log('BondRedemtionOracle tx filed; nvm', e);
    }
}
