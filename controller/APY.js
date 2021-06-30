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

const arthcontroller = new web3.eth.Contract(ArthController, '0x44C2993C9BF54b211e134e2cD4b99Db4aFE2E20e')
const arthxmahaStakePool = new web3.eth.Contract(StakeARTHXRMAHA, '0x710B89933E82360B93bc4C4e6E2c4FA82Fd2C7f0')
const stakeArthxArth = new web3.eth.Contract(staggingBasicStaking, '0x83bF88AF74743916db6e140768c9F9f681A9B276')
const ArthArthxLP = new web3.eth.Contract(UniswapV2Pair, '0x90edfEe14635de0574cb2cc210B5196B973aB1ab')

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
    const arthxPrice = await arthcontroller.methods.getARTHPrice().call()
    
    return arthxPrice
}

//getArthPrice()
const getArthxPrice = async () => {
    const arthPrice = await arthcontroller.methods.getARTHXPrice().call()

    return arthPrice
}

// const getMahaPrice = async () => {
//     const mahaPrice = await arthcontroller.methods.getMAHAPrice().call()

//     return mahaPrice
// }

const getEthGmuPrice = async () => {
    const ethGmuPrice = await arthcontroller.methods.getETHGMUPrice().call()
    return ethGmuPrice
}

const getarthWethLP = async () => {
    let parsedBody = data
    let amount = parsedBody.amount

    const reserves = await arthWethLP.methods.getReserves().call()
    let arthWethLPReserve0 = ( reserves._reserve0 / 10**18 )
    let arthWethLPReserve1 = ( reserves._reserve1 / 10**18 )

    let arthPrice = (await getArthPrice()) / 10**6 
    let wethGMUPrice = Number((await getEthGmuPrice()) / 10**6 )
    let realWethPrice = await getRealWethPrice()

    let arthUsdPrice = arthWethLPReserve0 * arthPrice
    let wethGMUUsdPrice = arthWethLPReserve1 * wethGMUPrice
    let wethUsdPrice = arthWethLPReserve1 * realWethPrice
    
    // arth/eth 
    let arthEthGMUprice = Number((arthUsdPrice / wethGMUPrice))
    let arthEthprice = Number((arthUsdPrice / realWethPrice))

    let sumOfReserve = (arthWethLPReserve0 + arthWethLPReserve1)
    let totalSupply = await arthWethLP.methods.totalSupply().call()
    let LPUSD = sumOfReserve / totalSupply
    let sevenDaysReward = Number (await arthWethLPStake.methods.getRewardForDuration().call())
    // TLV - summ of the reserves * arth/eth usdt
    // 1 LP token = TLV / total supply

    // console.log(arthWethLPReserve0, arthWethLPReserve1)
    // console.log(arthPrice, arthEthGMUprice, arthEthprice,  wethGMUPrice, realWethPrice);
    // console.log(arthUsdPrice, wethGMUUsdPrice, wethUsdPrice);
    //console.log(sumOfReserve, arthEthGMUprice, arthEthprice, LPUSD, sevenDaysReward);

    let oneDayRewardAmount = (sevenDaysReward / 7) * LPUSD
    let sevenDayRewardAmount = sevenDaysReward * LPUSD
    let halfYearlyRewardAmount = (oneDayRewardAmount * 180) * LPUSD
    //console.log(oneDayRewardAmount, sevenDayRewardAmount, halfYearlyRewardAmount);
    // rewards per token 
    // 6 months pool duration

    let APY = ((halfYearlyRewardAmount * 2) / amount) * 100
    res.send({ "APY": APY })
}

const getArthMahaLPTokenPrice = async (data, res) => {
    let parsedBody = data
    let amount = parsedBody.amount

    const reserves = await arthMahaLP.methods.getReserves().call()
    let arthMahaLPReserve0 = (reserves._reserve0 / 10 ** 18)
    let arthMahaLPReserve1 = (reserves._reserve1 / 10 ** 18)

    let arthPrice = (await getArthPrice()) / 10 ** 6
    let wethGMUPrice = Number((await getMahaPrice()) / 10 ** 6)
    let realWethPrice = await getRealWethPrice()

    let arthUsdPrice = arthMahaLPReserve0 * arthPrice
    let wethGMUUsdPrice = arthMahaLPReserve1 * wethGMUPrice
    let wethUsdPrice = arthMahaLPReserve1 * realWethPrice

    // arth/eth 
    let arthEthGMUprice = Number((arthUsdPrice / wethGMUPrice))
    let arthEthprice = Number((arthUsdPrice / realWethPrice))

    let sumOfReserve = (arthMahaLPReserve0 + arthMahaLPReserve1)
    let totalSupply = await arthMahaLP.methods.totalSupply().call()
    let LPUSD = sumOfReserve / totalSupply
    let sevenDaysReward = Number(await arthMahaStake.methods.getRewardForDuration().call())
    // TLV - summ of the reserves * arth/eth usdt
    // 1 LP token = TLV / total supply

    let oneDayRewardAmount = (sevenDaysReward / 7) * LPUSD
    let sevenDayRewardAmount = sevenDaysReward * LPUSD
    let halfYearlyRewardAmount = (oneDayRewardAmount * 180) * LPUSD

    let APY = ((halfYearlyRewardAmount * 2) / amount) * 100
    //console.log(APY);
    res.send({ "APY": APY })
}

const getArthxWethLPTokenPrice = async (data, res) => {
    let parsedBody = data
    let amount = parsedBody.amount

    const reserves = await arthxWethLP.methods.getReserves().call()
    let arthxWethLPReserve0 = (reserves._reserve0 / 10 ** 18)
    let arthxWethLPReserve1 = (reserves._reserve1 / 10 ** 18)

    let arthPrice = (await getArthPrice()) / 10 ** 6
    //let wethGMUPrice = Number((await getEthGmuPrice()) / 10 ** 6)
    //let realWethPrice = await getRealWethPrice()

    let arthUsdPrice = arthxWethLPReserve0 * arthPrice
    // let wethGMUUsdPrice = arthxWethLPReserve1 * wethGMUPrice
    // let wethUsdPrice = arthxWethLPReserve1 * realWethPrice

    // arth/eth 
    // let arthEthGMUprice = Number((arthUsdPrice / wethGMUPrice))
    // let arthEthprice = Number((arthUsdPrice / realWethPrice))

    let sumOfReserve = (arthxWethLPReserve0 + arthxWethLPReserve1)
    let totalSupply = await arthxWethLP.methods.totalSupply().call()
    // let tvlGmu = Number(sumOfReserve * arthEthGMUprice)
    let LPUSD = sumOfReserve / totalSupply
    let sevenDaysReward = Number(await arthxwethStake.methods.getRewardForDuration().call())
    // TLV - summ of the reserves * arth/eth usdt
    // 1 LP token = TLV / total supply

    let oneDayRewardAmount = (sevenDaysReward / 7) * LPUSD
    let sevenDayRewardAmount = sevenDaysReward * LPUSD
    let halfYearlyRewardAmount = (oneDayRewardAmount * 180) * LPUSD
    //console.log(oneDayRewardAmount, sevenDayRewardAmount, halfYearlyRewardAmount);
    // rewards per token 
    // 6 months pool duration

    let APY = ((halfYearlyRewardAmount * 2) / amount) * 100
    //console.log(APY);
    res.send({ "APY": APY })
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

const arthxarth = async () => {
    
    const reserves = await ArthArthxLP.methods.getReserves().call()
    console.log('reserves', reserves);
    
    let artharthxLPReserve0 = (reserves._reserve0 / 10 ** 18)
    let artharthxLPReserve1 = (reserves._reserve1 / 10 ** 18)
    console.log('reserves0', artharthxLPReserve0, 'reserves1', artharthxLPReserve1);
    
    // let arthPrice = (await getArthPrice()) / 10 ** 6
    // let arthUsdPrice = arthxWethLPReserve0 * arthPrice

    let sumOfReserve = (artharthxLPReserve0 + artharthxLPReserve1)
    console.log('sumOfReserve', sumOfReserve);

    let totalSupply = await ArthArthxLP.methods.totalSupply().call()
    console.log('totalSupply', totalSupply);

    // let tvlGmu = Number(sumOfReserve * arthEthGMUprice)
    let LPUSD = sumOfReserve / totalSupply
    console.log('LPUSD', LPUSD);
}
arthxarth()

const arthxAPY = async (req, res) => {
    try {
        const mahaprice = JSON.parse(await getMahaPrice())
        const arthxPrice = 0.01//await getArthxPrice()
        const rewardForDuration = Number(await arthxmahaStakePool.methods.getRewardForDuration().call())
        const totalSupply = await arthxmahaStakePool.methods.totalSupply().call()
               
        let rewardUSD = mahaprice.mahadao.usd * rewardForDuration/ 1e18
        let totalSupplyUSD = (totalSupply / 1e18) * arthxPrice
        
        let APY = ((rewardUSD /totalSupplyUSD ) * 100) * 52 
        console.log('rewardUSD', rewardUSD, 'totalSupplyUSD', totalSupplyUSD, 'APY', APY);

        res.send({ APY : APY })
    } catch (e) {
        console.log(e);
    }
}


//return 100 * (Math.pow((supplyRatePerBlock / ethMantissa * blocksPerDay) + 1, daysPerYear - 1) - 1);
const main = async () => {
    let wethGeckoPrice = await getRealWethPrice()
    //console.log(wethGeckoPrice);
    // //let arthPrice = await getArthPrice()
    // let mahaPrice = await getMahaPrice()
    // console.log(mahaPrice);
    let arthxPrice = await getArthxPrice()
    console.log(arthxPrice);
    // let ethGmuPrice = await getEthGmuPrice()
    // console.log(wethGeckoPrice, mahaPrice, arthxPrice, ethGmuPrice);
}

//main()
