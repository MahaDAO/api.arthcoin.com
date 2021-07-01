//imp
const Web3 = require('web3');
const Provider = require('@truffle/hdwallet-provider')
const uniswapPrice = require('uniswap-price')
const CoinGecko = require('coingecko-api');
const request = require('request-promise');

const web3 = new Web3('https://rpc-mainnet.matic.quiknode.pro')
const ArthController = require('../deployments/abi/ArthController.json')
//const ArthShares = require('../deployments/abi/ArthShares.json')
//const MahaToken = require('../deployments/abi/MahaToken.json')

//const UniswapV2Pair = require('../deployments/abi/UniswapV2Pair.json')
const StakeARTHXRMAHA = require('../manualABI/BasicStakingSpecificReward.json')
const staggingBasicStaking = require('../manualABI/staging/abi/BasicStaking.json')
const UniswapV2Pair = require('../manualABI/staging/abi/UniswapV2Pair.json')

const arthcontroller = new web3.eth.Contract(ArthController, '0x8fce074b01040805aEeBCa13a9b2500316321A18')
const arthxmahaStakePool = new web3.eth.Contract(StakeARTHXRMAHA, '0xAd7CD904568E5a23fdbE57d6C32fB5D1f91eBd0d')
const stakeArthxArth = new web3.eth.Contract(staggingBasicStaking, '0x83bF88AF74743916db6e140768c9F9f681A9B276')
const ArthArthxLP = new web3.eth.Contract(UniswapV2Pair, '0x90edfEe14635de0574cb2cc210B5196B973aB1ab')
const StakeARTH = new web3.eth.Contract(staggingBasicStaking, '0x653887B8A074DAb771Dd116473c046e7b210c68c')


const sendRequest = async (method, url, body) => {
    const option = {
        'method': method,
        'url': url,
        'headers': {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }

    return await request(option)
}

const getRealWethPrice = async () => {
    const wethPrice = await sendRequest(
        'GET',
        `https://api.coingecko.com/api/v3/simple/price?ids=weth&vs_currencies=usd`,
        {}
    )
    
    let price = JSON.parse(wethPrice)

    return price.weth.usd
}

const getArthPrice = async () => {
    // will fetch it from coingecko
    return 1;
}
//getArthPrice()

const getArthxPrice = async () => {
    try {
        let arthxPriceFromController = await arthcontroller.methods.getARTHXPrice().call()
        
        if (typeof(arthxPriceFromController) === Number) {
            console.log('true');
            return arthxPriceFromController
        } 
    } catch (e) {
        if (e) {
            return 0.01
        }
    }
}
//getArthxPrice()


const getEthGmuPrice = async () => {
    const ethGmuPrice = await arthcontroller.methods.getETHGMUPrice().call()
    return ethGmuPrice
}


const getMahaPrice = async () => {
    try {
        const priceInJsonString = await sendRequest(
            'GET', 
            `https://api.coingecko.com/api/v3/simple/price?ids=mahadao&vs_currencies=usd`,
            {}
        );
        
        return priceInJsonString
    } catch (e) {
        return null;
    }
}

// const arthxarth = async () => {
    
//     const reserves = await ArthArthxLP.methods.getReserves().call()
//     console.log('reserves', reserves);
    
//     let artharthxLPReserve0 = (reserves._reserve0 / 10 ** 18)
//     let artharthxLPReserve1 = (reserves._reserve1 / 10 ** 18)
//     console.log('reserves0', artharthxLPReserve0, 'reserves1', artharthxLPReserve1);
    
//     // let arthxPrice = (await getArthxPrice())
//     // console.log(arthxPrice);
//     //let arthPrice = (await getArthPrice()) / 10 ** 6
//     let arthUsdWorth = artharthxLPReserve0 * 1//arthPrice
//     let arthxUsdWorth = artharthxLPReserve1 * 0.1//arthxPrice

//     let sumOfReserve = (arthUsdWorth + arthxUsdWorth)
//     // console.log('sumOfReserve', sumOfReserve);

//     let totalSupplyLP = await ArthArthxLP.methods.totalSupply().call()
//     console.log('totalSupplyLP', totalSupplyLP);

//     // let tvlGmu = Number(sumOfReserve * arthEthGMUprice)
//     let LPUSD = sumOfReserve / totalSupplyLP
//     console.log('LPUSD', LPUSD);

//     const quaterlyRewards  = Number(await stakeArthxArth.methods.getRewardForDuration().call())
//     let oneDayRewardAmount = (quaterlyRewards / 90) * LPUSD
//     let halfYearlyRewardAmount = (oneDayRewardAmount * 180) * LPUSD

//     let APY = ((halfYearlyRewardAmount * 2) / amount) * 100
// }

// StakeARTHXARTH staking contract
const arthxarth = async () => {
    try {
        const mahaprice = JSON.parse(await getMahaPrice())
        const arthxPrice = await getArthxPrice()
        let rewardTokenPrice = arthxPrice / mahaprice.mahadao.usd
        
        console.log('rewardTokenPrice', rewardTokenPrice);

        const rewardForDuration = Number(await stakeArthxArth.methods.getRewardForDuration().call())
        const totalSupply = await stakeArthxArth.methods.totalSupply().call()
        console.log('totalSupply', typeof(totalSupply));

        let rewardUSD = rewardTokenPrice * rewardForDuration / 1e18
        let totalSupplyUSD = (totalSupply / 1e18) * rewardTokenPrice

        let APY = ((rewardUSD / totalSupplyUSD) * 100) * 4
        console.log('rewardUSD', rewardUSD, 'totalSupplyUSD', totalSupplyUSD, 'APY', APY);

        //res.send({ APY: APY })
    } catch (e) {
        console.log(e);
    }
}
//arthxarth()

// StakeARTHXRMAHA staking contract
const arthxAPY = async (req, res) => {
    try {
        const mahaprice = JSON.parse(await getMahaPrice())
        const arthxPrice = 0.01//await getArthxPrice()
        const rewardForDuration = Number(await arthxmahaStakePool.methods.getRewardForDuration().call())
        const totalSupply = await arthxmahaStakePool.methods.totalSupply().call()
        console.log('totalSupply', totalSupply);
               
        let rewardUSD = mahaprice.mahadao.usd * rewardForDuration/ 1e18
        let totalSupplyUSD = (totalSupply / 1e18) * arthxPrice
        
        let APY = ((rewardUSD / totalSupplyUSD ) * 100) * 52 
        console.log('rewardUSD', rewardUSD, 'totalSupplyUSD', totalSupplyUSD, 'APY', APY);

        //res.send({ APY : APY })
    } catch (e) {
        console.log(e);
    }
}
//arthxAPY()

// StakeARTH staking contract
const arthAPY = async (req, res) => {
    try {
        const mahaprice = JSON.parse(await getMahaPrice())
        const arthxPrice = await getArthxPrice()
        const arthPrice = await getArthPrice()
        const rewardForDuration = Number(await StakeARTH.methods.getRewardForDuration().call())
        const totalSupply = await StakeARTH.methods.totalSupply().call()

        let rewardTokenPrice = arthxPrice / mahaprice.mahadao.usd
        console.log('rewardTokenPrice', rewardTokenPrice);

        let rewardUSD = rewardTokenPrice * rewardForDuration / 1e18
        let totalSupplyUSD = (totalSupply / 1e18) * arthPrice

        let APY = ((rewardUSD / totalSupplyUSD) * 100) * 4
        console.log('rewardUSD', rewardUSD, 'totalSupplyUSD', totalSupplyUSD, 'APY', APY);

        res.send({ APY: APY })
    } catch (e) {
        console.log(e);
    }
}
//arthAPY()

