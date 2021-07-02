const Web3 = require('web3');

const ArthController = require('../deployments/abi/ArthController.json')
const web3Matic = new Web3('https://rpc-mainnet.matic.quiknode.pro')
const web3ETH = new Web3('https://mainnet.infura.io/v3/5b6b424971054ddf8168ef16aab3dd09')

const arthcontrollerMatic = new web3Matic.eth.Contract(ArthController, '0x44C2993C9BF54b211e134e2cD4b99Db4aFE2E20e')
const arthcontrollerETH = new web3ETH.eth.Contract(ArthController, '0xB89018a436BC5ca948D97f4fbadCf4F0dED3FA9e')

const fetchCollateralValueETH = async () => {
    const collateralValue = await arthcontrollerETH.methods.getGlobalCollateralValue().call()

    return collateralValue
}

const fetchCollateralValueMatic = async () => {
    const collateralValue = await arthcontrollerMatic.methods.getGlobalCollateralValue().call()

    return collateralValue
}

export const getCollateralValue = async (req, res) => {
    try {
        let ethCollateralRaised = Number(Web3.utils.fromWei(await fetchCollateralValueETH()))
        console.log('ethCollateralRaised', ethCollateralRaised);
        let MaticCollateralRaised = Number(Web3.utils.fromWei(await fetchCollateralValueMatic()))
        let TotalCollateralRaised = ethCollateralRaised + MaticCollateralRaised + 25000

        //console.log('TotalCollateralRaised',TotalCollateralRaised);
        //let response = JSON.stringify({ collateralRaised: TotalCollateralRaised })
        res.send({ collateralRaised: TotalCollateralRaised })
    } catch(e) {
        console.log(e);
    }
}
//getCollateralValue()

const getETHArthCirculatingSupply = async () => {
    const arthSupply = await arthcontrollerETH.methods.getARTHSupply().call()

    return arthSupply
}

const getMaticArthCirculatingSupply = async () => {
    const arthSupply = await arthcontrollerMatic.methods.getARTHSupply().call()

    return arthSupply
}

export const getArthSupply = async (req, res) => {
    try {
        //let ethArthSupply = Number(Web3.utils.fromWei(await getETHArthCirculatingSupply()))
        let maticArthSupply = Number(Web3.utils.fromWei(await getMaticArthCirculatingSupply()))
        //let totalArthSupply = ethArthSupply + maticArthSupply

        //console.log(totalArthSupply, ethArthSupply, maticArthSupply);
        res.send({ arthsupply: maticArthSupply })
    } catch(e) {
        console.log(e);
    }
}

export const test = async (req, res) => {
    res.json({ success: 'true' })
}
