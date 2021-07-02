const Web3 = require('web3');
const web3 = new Web3('https://apis.ankr.com/0aa7b5a6761f4b87ae97c6b718d900ff/0a39ba8bf2c40d99b20fea4372ebaa68/polygon/full/main')
const request = require('request-promise');

// ABIs
const ArthController = require('../deployments/abi/ArthController.json')
const StakeARTHXRMAHA = require('../manualABI/BasicStakingSpecificReward.json')
const staggingBasicStaking = require('../manualABI/staging/abi/BasicStaking.json')
const UniswapV2Pair = require('../manualABI/staging/abi/UniswapV2Pair.json')
const PoolTokenAbi = require('../manualABI/staging/abi/PoolToken.json')

const ArthSharesAbi = require('../deployments/abi/ARTHShares.json')
const MahaTokenAbi = require('../manualABI/MahaToken.json')

// contracts
const arthcontroller = new web3.eth.Contract(ArthController, '0x79d93EA8500226b203180E62eE7666a19C4443bB')
const arthxmahaStakePool = new web3.eth.Contract(StakeARTHXRMAHA, '0x710B89933E82360B93bc4C4e6E2c4FA82Fd2C7f0')
const stakeArthxArth = new web3.eth.Contract(staggingBasicStaking, '0xF59Cd4B9Cc341E6650ABB1288C5aC01e9f37f9b5')
const stakeARTH = new web3.eth.Contract(staggingBasicStaking, '0xF4de24E6393793E44Bd69e8b888828995A61E08A')
const stakeARTHMaha = new web3.eth.Contract(staggingBasicStaking, '0x12531272961Bc1781CD789e3a00b4857491eB053')
const stakeARTHX = new web3.eth.Contract(staggingBasicStaking, '0x17594C5a5305a5Ba032012AedD5bBd5906852020')
const stakeMaha = new web3.eth.Contract(staggingBasicStaking, '0x65Ec8480D686E26c7E2AB2b0932CbacD5DaEdd2E')
const stakeArthUsdc = new web3.eth.Contract(staggingBasicStaking, '0x99547b2E9DF856760918ad63dA09795dC1a0F3Fd')

const arthx = new web3.eth.Contract(ArthSharesAbi, '0xD354D56DaE3588F1145dd664bc5094437b889d6F')
const maha = new web3.eth.Contract(MahaTokenAbi, '0xeDd6cA8A4202d4a36611e2fff109648c4863ae19') //'0xeDd6cA8A4202d4a36611e2fff109648c4863ae19')
const poolToken = new web3.eth.Contract(PoolTokenAbi, '0x963911186972433fFF9FE2aA5959dA3918456B59')
const poolTokenAddress = '0x963911186972433fFF9FE2aA5959dA3918456B59'

const ArthArthxLP = new web3.eth.Contract(UniswapV2Pair, '0x742146b6241B779f7fb9759E7F45772597B08DF1')
const ArthMahaLP = new web3.eth.Contract(UniswapV2Pair, '0xd10f5Bb8DE9fDeD024F0D995793B750D207095Fc')
const ArthUsdcLP = new web3.eth.Contract(UniswapV2Pair, '0xe11bd5a3927A2a4e55266959B348c39bA9eaECD4')

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

const getArthPrice = async () => {
    // will fetch it from coingecko
    return 2;
}
//getArthPrice()

const getArthxPrice = async () => {
    try {
        let arthxPriceFromController = await arthcontroller.methods.getARTHXPrice().call()
        //console.log('arthxprice:52', arthxPriceFromController);
        if (arthxPriceFromController) {
            return arthxPriceFromController / 1e6
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
export const arthxarth = async () => {
    console.log('test');
    const reserves = await ArthArthxLP.methods.getReserves().call()
    //console.log('reserves', reserves);

    let artharthxLPReserve0 = (reserves._reserve0 / 10 ** 18)
    let artharthxLPReserve1 = (reserves._reserve1 / 10 ** 18)
    console.log('reserves0', artharthxLPReserve0, 'reserves1', artharthxLPReserve1);

    let arthxPrice = (await getArthxPrice())
    console.log('arthxPrice', arthxPrice);
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
    //res.send({ APY: APY })
    return { APY: APY }
}
//arthxarth()

// 
export const arthusdc = async () => {
    console.log('test');
    const reserves = await ArthUsdcLP.methods.getReserves().call()
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

    let totalSupplyLP = await ArthUsdcLP.methods.totalSupply().call()
    console.log('totalSupplyLP', totalSupplyLP);

    // let tvlGmu = Number(sumOfReserve * arthEthGMUprice)
    let LPUSD = sumOfReserve / totalSupplyLP
    console.log('LPUSD', LPUSD);

    let poolTokenArthxBalance = (await arthx.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
    let poolTokenMahaBalance = (await maha.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
    let pooTokenTotalSupply = (await poolToken.methods.totalSupply().call()) / 10 ** 18

    const mahaprice = JSON.parse(await getMahaPrice())
    const PriceOfPoolToken = ((poolTokenArthxBalance * await getArthxPrice()) + (poolTokenMahaBalance * mahaprice.mahadao.usd)) / pooTokenTotalSupply

    const quaterlyRewards = Number(await stakeArthUsdc.methods.getRewardForDuration().call())
    let rewardUSD = PriceOfPoolToken * quaterlyRewards / 1e18

    const totalSupply = Number(await stakeArthUsdc.methods.totalSupply().call())

    let APY = ((rewardUSD / (totalSupply * LPUSD)) * 100) * 4
    //res.send({ APY: APY })
    return { APY: APY }
}

// StakeARTHXRMAHA staking contract
export const arthxAPY = async () => {
    try {
        const mahaprice = JSON.parse(await getMahaPrice())
        const arthxPrice = await getArthxPrice()
        const rewardForDuration = Number(await arthxmahaStakePool.methods.getRewardForDuration().call())
        const totalSupply = await arthxmahaStakePool.methods.totalSupply().call()
        console.log('totalSupply', totalSupply);

        console.log('mahaprice: 178', mahaprice);
        let rewardUSD = mahaprice.mahadao.usd * rewardForDuration/ 1e18
        let totalSupplyUSD = (totalSupply / 1e18) * arthxPrice

        let APY = ((rewardUSD / totalSupplyUSD ) * 100) * 52
        console.log('rewardUSD', rewardUSD, 'totalSupplyUSD', totalSupplyUSD, 'APY', APY);

        //res.send({ APY : APY })
        return { APY: APY }
    } catch (e) {
        console.log(e);
    }
}
//arthxAPY()

// StakeARTH staking contract
export const arthAPY = async () => {
    try {
        const mahaprice = JSON.parse(await getMahaPrice())
        const arthxPrice = await getArthxPrice()
        const arthPrice = await getArthPrice()
        const rewardForDuration = Number(await stakeARTH.methods.getRewardForDuration().call())
        const totalSupply = await stakeARTH.methods.totalSupply().call()

        let poolTokenArthxBalance = (await arthx.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
        let poolTokenMahaBalance = (await maha.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
        let pooTokenTotalSupply = (await poolToken.methods.totalSupply().call()) / 10 ** 18

        const PriceOfPoolToken = ((poolTokenArthxBalance * await getArthPrice()) + (poolTokenMahaBalance * mahaprice.mahadao.usd)) / pooTokenTotalSupply

        let rewardUSD = PriceOfPoolToken * rewardForDuration / 1e18
        let totalSupplyUSD = (totalSupply / 1e18) * arthPrice

        let APY = ((rewardUSD / totalSupplyUSD) * 100) * 4
        console.log('rewardUSD', rewardUSD, 'totalSupplyUSD', totalSupplyUSD, 'APY', APY);

        //res.send({ APY: APY })
        return { APY: APY }
    } catch (e) {
        console.log(e);
    }
}
//arthAPY()

// StakeARTHMAHA contract for staking ARTHMAHA
export const arthMaha = async () => {

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
    // res.send({ APY: APY})
    return { APY: APY }
}
//arthMaha()

//StakeARTHX staking contract
export const basicStakingArthx = async () => {
    try {
        const mahaprice = JSON.parse(await getMahaPrice())
        const arthxPrice = await getArthxPrice()

        let poolTokenArthxBalance = (await arthx.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
        let poolTokenMahaBalance = (await maha.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
        let pooTokenTotalSupply = (await poolToken.methods.totalSupply().call()) / 10 ** 18

        const PriceOfPoolToken = ((poolTokenArthxBalance * await getArthxPrice()) + (poolTokenMahaBalance * mahaprice.mahadao.usd)) / pooTokenTotalSupply
        
        const rewardForDuration = Number(await stakeARTHX.methods.getRewardForDuration().call())
        const totalSupply = await stakeARTHX.methods.totalSupply().call()
        console.log('totalSupply', typeof (totalSupply));

        let rewardUSD = PriceOfPoolToken * rewardForDuration / 1e18
        let totalSupplyUSD = (totalSupply / 1e18) * PriceOfPoolToken

        let APY = ((rewardUSD / totalSupplyUSD) * 100) * 4
        console.log('rewardUSD', rewardUSD, 'totalSupplyUSD', totalSupplyUSD, 'APY', APY);

        //res.send({ APY: APY })
        return { APY: APY }
    } catch (e) {
        console.log(e);
    }
}

export const basicStakingMaha = async () => {
    try {
        const mahaprice = JSON.parse(await getMahaPrice())
        const arthxPrice = await getArthxPrice()
        const arthPrice = await getArthPrice()
        const rewardForDuration = Number(await stakeMaha.methods.getRewardForDuration().call())
        const totalSupply = await stakeMaha.methods.totalSupply().call()

        let poolTokenArthxBalance = (await arthx.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
        let poolTokenMahaBalance = (await maha.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
        let pooTokenTotalSupply = (await poolToken.methods.totalSupply().call()) / 10 ** 18

        const PriceOfPoolToken = ((poolTokenArthxBalance * await getArthPrice()) + (poolTokenMahaBalance * mahaprice.mahadao.usd)) / pooTokenTotalSupply

        let rewardUSD = PriceOfPoolToken * rewardForDuration / 1e18
        let totalSupplyUSD = (totalSupply / 1e18) * arthPrice

        let APY = ((rewardUSD / totalSupplyUSD) * 100) * 4
        console.log('rewardUSD', rewardUSD, 'totalSupplyUSD', totalSupplyUSD, 'APY', APY);

        //res.send({ APY: APY })
        return { APY: APY }
    } catch (e) {
        console.log(e);
    }
}

export const sendResponse = async (req, res) => {
    console.log('frontend', req);
    if (req.key === 'artharthx') {
        let apy = await arthxarth()
        res.send(apy)
    } else if (req.key === 'arthxrmaha'){
        let apy = await arthxAPY()
        res.send(apy)
    } else if (req.key === 'arthx') {
        let apy = await basicStakingArthx()
        res.send(apy)
    } else if (req.key === 'arth') {
        let apy = await arthAPY()
        res.send(apy)
    } else if (req.key === 'arthmaha') {
        let apy = await arthMaha()
        res.send(apy)
    } else if (req.key === 'arthusdc') {
        let apy = await arthusdc()
        res.send(apy)
    } else if (req.key === 'maha') {
        let apy = await basicStakingMaha()
        res.send(apy)
    } else {
        res.send({ error: 'invalid key'})
    }
}