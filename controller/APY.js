//imp
const Web3 = require('web3');
const Provider = require('@truffle/hdwallet-provider')
const uniswapPrice = require('uniswap-price')
const CoinGecko = require('coingecko-api');
const request = require('request-promise');

const ArthController = require('../deployments/abi/ArthController.json')
//const ArthShares = require('../deployments/abi/ArthShares.json')
//const MahaToken = require('../deployments/abi/MahaToken.json')
const UniswapV2Pair = require('../deployments/abi/UniswapV2Pair.json')
//const BoostedStaking = require('../deployments/abi/BoostedStaking.json')
const web3 = new Web3('https://rpc-mainnet.matic.network')

const arthcontroller = new web3.eth.Contract(ArthController, '0x44C2993C9BF54b211e134e2cD4b99Db4aFE2E20e')
// const arthWethLP = new web3.eth.Contract(UniswapV2Pair, '0x9EA533408BC4d516bd400FEFa275E2A25eb4197f')
// const arthWethLPStake = new web3.eth.Contract(BoostedStaking, '0x0710EB668F0548f9eceaF84025E3626B2c034c78')
// const arthMahaLP = new web3.eth.Contract(UniswapV2Pair, '0xf1c8aaD532B39D5318D0058c63ce41CA981bf7B2')
// const arthMahaStake = new web3.eth.Contract(BoostedStaking, '0x97908511ef2382aEbb54EA68A668Af272ffd7Bad')
// const arthxWethLP = new web3.eth.Contract(UniswapV2Pair, '0x7D792a3AeE584802191Ed91e57F20B99E0eEeb5A')
// const arthxwethStake = new web3.eth.Contract(BoostedStaking, '0xda184BD8819Ce67cF55210319cc169E3bf88Ce69')

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

const getMahaPrice = async () => {
    const mahaPrice = await arthcontroller.methods.getMAHAPrice().call()

    return mahaPrice
}

const getEthGmuPrice = async () => {
    const ethGmuPrice = await arthcontroller.methods.getETHGMUPrice().call()

    return ethGmuPrice
}

export const getArthWethLPTokenPrice = async (data, res) => {
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

export const getArthMahaLPTokenPrice = async (data, res) => {
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

export const getArthxWethLPTokenPrice = async (data, res) => {
    let parsedBody = data
    let amount = parsedBody.amount

    const reserves = await arthxWethLP.methods.getReserves().call()
    let arthxWethLPReserve0 = (reserves._reserve0 / 10 ** 18)
    let arthxWethLPReserve1 = (reserves._reserve1 / 10 ** 18)

    let arthPrice = (await getArthPrice()) / 10 ** 6
    let wethGMUPrice = Number((await getEthGmuPrice()) / 10 ** 6)
    let realWethPrice = await getRealWethPrice()

    let arthUsdPrice = arthxWethLPReserve0 * arthPrice
    let wethGMUUsdPrice = arthxWethLPReserve1 * wethGMUPrice
    let wethUsdPrice = arthxWethLPReserve1 * realWethPrice

    // arth/eth 
    let arthEthGMUprice = Number((arthUsdPrice / wethGMUPrice))
    let arthEthprice = Number((arthUsdPrice / realWethPrice))

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
