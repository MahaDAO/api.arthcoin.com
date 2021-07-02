const Web3 = require('web3');
const web3 = new Web3('https://rpc-mainnet.matic.quiknode.pro')
const request = require('request-promise');

const ArthController = require('../deployments/abi/ArthController.json')
const StakeARTHXRMAHA = require('../manualABI/BasicStakingSpecificReward.json')
const staggingBasicStaking = require('../manualABI/staging/abi/BasicStaking.json')
const UniswapV2Pair = require('../manualABI/staging/abi/UniswapV2Pair.json')
const PoolTokenAbi = require('../manualABI/staging/abi/PoolToken.json')

const ArthSharesAbi = require('../deployments/abi/ARTHShares.json')
const MahaTokenAbi = require('../manualABI/MahaToken.json')

const arthcontroller = new web3.eth.Contract(ArthController, '0x8fce074b01040805aEeBCa13a9b2500316321A18')
const arthxmahaStakePool = new web3.eth.Contract(StakeARTHXRMAHA, '0x710B89933E82360B93bc4C4e6E2c4FA82Fd2C7f0')
const stakeArthxArth = new web3.eth.Contract(staggingBasicStaking, '0x83bF88AF74743916db6e140768c9F9f681A9B276')
const stakeARTH = new web3.eth.Contract(staggingBasicStaking, '0x653887B8A074DAb771Dd116473c046e7b210c68c')
const stakeARTHMaha = new web3.eth.Contract(staggingBasicStaking, '0xAd7CD904568E5a23fdbE57d6C32fB5D1f91eBd0d')
const stakeARTHX = new web3.eth.Contract(staggingBasicStaking, '0x9053126c1D10F9c84Ef6F3b66152fB692a3a6c2B')

const arthx = new web3.eth.Contract(ArthSharesAbi, '0x52e15E026971B58CE688A045Bdc2c83A6D46f911')
const maha = new web3.eth.Contract(MahaTokenAbi, '0x3b2ca68671b8df5b7ce4ef98b4280fdee906cfbf') //'0xeDd6cA8A4202d4a36611e2fff109648c4863ae19')
const poolToken = new web3.eth.Contract(PoolTokenAbi, '0xc8Aa935bB66D46732800C4AD04eDdA385d197f06')
const poolTokenAddress = '0xc8Aa935bB66D46732800C4AD04eDdA385d197f06'

const ArthArthxLP = new web3.eth.Contract(UniswapV2Pair, '0x90edfEe14635de0574cb2cc210B5196B973aB1ab')
const ArthMahaLP = new web3.eth.Contract(UniswapV2Pair, '0x5D803e860c444a7cD71168f3211FaBbD52457EB4')

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
    return 2;
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

// StakeARTHXARTH contract for staking ARTHXARTH
const arthxarth = async () => {

    const reserves = await ArthArthxLP.methods.getReserves().call()
    console.log('reserves', reserves);

    let artharthxLPReserve0 = (reserves._reserve0 / 10 ** 18)
    let artharthxLPReserve1 = (reserves._reserve1 / 10 ** 18)
    console.log('reserves0', artharthxLPReserve0, 'reserves1', artharthxLPReserve1);

    // let arthxPrice = (await getArthxPrice())
    // console.log(arthxPrice);
    //let arthPrice = (await getArthPrice()) / 10 ** 6
    let arthUsdWorth = artharthxLPReserve0 * await getArthPrice()
    let arthxUsdWorth = artharthxLPReserve1 * await getArthxPrice()

    let sumOfReserve = (arthUsdWorth + arthxUsdWorth)
    // console.log('sumOfReserve', sumOfReserve);

    let totalSupplyLP = await ArthArthxLP.methods.totalSupply().call()
    console.log('totalSupplyLP', totalSupplyLP);

    // let tvlGmu = Number(sumOfReserve * arthEthGMUprice)
    let LPUSD = sumOfReserve / totalSupplyLP
    console.log('LPUSD', LPUSD);

    let poolTokenArthxBalance = (await arthx.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
    let poolTokenMahaBalance = (await maha.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
    let pooTokenTotalSupply = (await poolToken.methods.totalSupply().call()) / 10 ** 18

    const mahaprice = JSON.parse(await getMahaPrice())
    const PriceOfPoolToken = ((poolTokenArthxBalance * await getArthxPrice()) + (poolTokenMahaBalance * mahaprice.mahadao.usd)) / pooTokenTotalSupply
    
    const quaterlyRewards = Number(await stakeArthxArth.methods.getRewardForDuration().call())
    let rewardUSD = PriceOfPoolToken * quaterlyRewards / 1e18
    
    const totalSupply = Number(await stakeArthxArth.methods.totalSupply().call())

    let APY = ((rewardUSD / (totalSupply * LPUSD)) * 100) * 4
    console.log(APY);
}
//arthxarth()

// StakeARTHXRMAHA staking contract
const arthxAPY = async (req, res) => {
    try {
        const mahaprice = JSON.parse(await getMahaPrice())
        const arthxPrice = await getArthxPrice()
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
        const rewardForDuration = Number(await stakeARTH.methods.getRewardForDuration().call())
        const totalSupply = await stakeARTH.methods.totalSupply().call()

        let poolTokenArthxBalance = (await arthx.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
        let poolTokenMahaBalance = (await maha.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
        let pooTokenTotalSupply = (await poolToken.methods.totalSupply().call()) / 10 ** 18

        const mahaprice = JSON.parse(await getMahaPrice())
        const PriceOfPoolToken = ((poolTokenArthxBalance * await getArthPrice()) + (poolTokenMahaBalance * mahaprice.mahadao.usd)) / pooTokenTotalSupply

        let rewardUSD = PriceOfPoolToken * rewardForDuration / 1e18
        let totalSupplyUSD = (totalSupply / 1e18) * arthPrice

        let APY = ((rewardUSD / totalSupplyUSD) * 100) * 4
        console.log('rewardUSD', rewardUSD, 'totalSupplyUSD', totalSupplyUSD, 'APY', APY);

        res.send({ APY: APY })
    } catch (e) {
        console.log(e);
    }
}
//arthAPY()

// StakeARTHMAHA contract for staking ARTHMAHA
const arthMaha = async () => {

    const reserves = await ArthMahaLP.methods.getReserves().call()
    console.log('reserves', reserves);

    let artharthxLPReserve0 = (reserves._reserve0 / 10 ** 18)
    let artharthxLPReserve1 = (reserves._reserve1 / 10 ** 18)
    console.log('reserves0', artharthxLPReserve0, 'reserves1', artharthxLPReserve1);

    // let arthxPrice = (await getArthxPrice())
    // console.log(arthxPrice);
    //let arthPrice = (await getArthPrice()) / 10 ** 6
    let arthUsdWorth = artharthxLPReserve0 * await getArthPrice()
    let arthxUsdWorth = artharthxLPReserve1 * await getArthxPrice()

    let sumOfReserve = (arthUsdWorth + arthxUsdWorth)
    // console.log('sumOfReserve', sumOfReserve);

    let totalSupplyLP = await ArthMahaLP.methods.totalSupply().call()
    console.log('totalSupplyLP', totalSupplyLP);

    // let tvlGmu = Number(sumOfReserve * arthEthGMUprice)
    let LPUSD = sumOfReserve / totalSupplyLP
    console.log('LPUSD', LPUSD);

    let poolTokenArthxBalance = (await arthx.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
    let poolTokenMahaBalance = (await maha.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
    let pooTokenTotalSupply = (await poolToken.methods.totalSupply().call()) / 10 ** 18

    const mahaprice = JSON.parse(await getMahaPrice())
    const PriceOfPoolToken = ((poolTokenArthxBalance * await getArthxPrice()) + (poolTokenMahaBalance * mahaprice.mahadao.usd)) / pooTokenTotalSupply

    const quaterlyRewards = Number(await stakeARTHMaha.methods.getRewardForDuration().call())
    let rewardUSD = PriceOfPoolToken * quaterlyRewards / 1e18
    //console.log(rewardUSD);

    const totalSupply = Number(await stakeARTHMaha.methods.totalSupply().call())
    //console.log(totalSupply);

    let APY = ((rewardUSD / (totalSupply * LPUSD)) * 100) * 4
    //console.log(APY);
}
//arthMaha()

//StakeARTHX staking contract
const basicStakingArthx = async () => {
    try {
        const mahaprice = JSON.parse(await getMahaPrice())
        const arthxPrice = await getArthxPrice()

        let poolTokenArthxBalance = (await arthx.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
        let poolTokenMahaBalance = (await maha.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
        let pooTokenTotalSupply = (await poolToken.methods.totalSupply().call()) / 10 ** 18

        const mahaprice = JSON.parse(await getMahaPrice())
        const PriceOfPoolToken = ((poolTokenArthxBalance * await getArthxPrice()) + (poolTokenMahaBalance * mahaprice.mahadao.usd)) / pooTokenTotalSupply
        
        const rewardForDuration = Number(await stakeARTHX.methods.getRewardForDuration().call())
        const totalSupply = await stakeARTHX.methods.totalSupply().call()
        console.log('totalSupply', typeof (totalSupply));

        let rewardUSD = PriceOfPoolToken * rewardForDuration / 1e18
        let totalSupplyUSD = (totalSupply / 1e18) * PriceOfPoolToken

        let APY = ((rewardUSD / totalSupplyUSD) * 100) * 4
        console.log('rewardUSD', rewardUSD, 'totalSupplyUSD', totalSupplyUSD, 'APY', APY);

        //res.send({ APY: APY })
    } catch (e) {
        console.log(e);
    }
}

//StakeARTHX staking contract