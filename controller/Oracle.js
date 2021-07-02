const Web3 = require('web3');
const web3 = new Web3('https://rpc-mainnet.matic.quiknode.pro')
const request = require('request-promise');

const oracles = [
    'UniswapPairOracle_ARTH_ARTHX',
    'UniswapPairOracle_MAHA_ARTH'
];

const UniswapPairOracle = require('../deployments/abi/UniswapPairOracle.json')

export const updateOracles = async () => {

}