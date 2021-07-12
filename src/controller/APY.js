require('dotenv').config();
const rpc = process.env.RPC_URL;

const Web3 = require('web3');
const web3 = new Web3(rpc)
const request = require('request-promise');

// ABIs
const ArthController = require('./deployments/customAddedAbi/arthController.json')
const StakeARTHXRMAHA = require('./deployments/customAddedAbi/BasicStakingSpecificReward.json')
const staggingBasicStaking = require('./deployments/abi/BasicStaking.json')
const UniswapV2Pair = require('./deployments/abi/UniswapV2Pair.json')
const PoolTokenAbi = require('./deployments/abi/PoolToken.json')

// Pos Coins
const ArthSharesAbi = require('./deployments/abi/ARTHShares.json')
const MahaTokenAbi = require('./deployments/abi/MahaToken.json')

// contracts
const arthcontroller = new web3.eth.Contract(ArthController, '0x8604E0606245184c619830f9E795aea01F7A3d38')
const arthxmahaStakePool = new web3.eth.Contract(StakeARTHXRMAHA, '0x710B89933E82360B93bc4C4e6E2c4FA82Fd2C7f0')
const stakeArthxArth = new web3.eth.Contract(staggingBasicStaking, '0xF59Cd4B9Cc341E6650ABB1288C5aC01e9f37f9b5')
const stakeARTH = new web3.eth.Contract(staggingBasicStaking, '0xF4de24E6393793E44Bd69e8b888828995A61E08A')
const stakeARTHMaha = new web3.eth.Contract(staggingBasicStaking, '0x9c5D406623aA49ACbE982E20F995a710Af4e5EC9')
const stakeARTHX = new web3.eth.Contract(staggingBasicStaking, '0x17594C5a5305a5Ba032012AedD5bBd5906852020')
const stakeMaha = new web3.eth.Contract(staggingBasicStaking, '0x65Ec8480D686E26c7E2AB2b0932CbacD5DaEdd2E')
const stakeArthUsdc = new web3.eth.Contract(staggingBasicStaking, '0x99547b2E9DF856760918ad63dA09795dC1a0F3Fd')

// POS coins and reward token
const arthx = new web3.eth.Contract(ArthSharesAbi, '0xD354D56DaE3588F1145dd664bc5094437b889d6F')
const maha = new web3.eth.Contract(MahaTokenAbi, '0xeDd6cA8A4202d4a36611e2fff109648c4863ae19') //'0xeDd6cA8A4202d4a36611e2fff109648c4863ae19')
const poolToken = new web3.eth.Contract(PoolTokenAbi, '0x963911186972433fFF9FE2aA5959dA3918456B59')
const poolTokenAddress = '0x963911186972433fFF9FE2aA5959dA3918456B59'

// LP pools
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


export const getArthxPrice = async () => {
  console.log('getArthxPrice');
  try {
    let arthxPriceFromController = await arthcontroller.methods.getARTHXPrice().call()
    //console.log('arthxprice:62', arthxPriceFromController);
    if (arthxPriceFromController) {
      //console.log('arthxPriceFromController', arthxPriceFromController);
      return arthxPriceFromController / 1e6
    }
  } catch (e) {
    console.log(e);
    if (e) {
      return 0.000573
    }
  }
}


const getMahaPrice = async () => {
  try {
    const priceInJsonString = await sendRequest(
        'GET',
        `https://api.coingecko.com/api/v3/simple/price?ids=mahadao&vs_currencies=usd`,
        {}
    );

    //console.log(priceInJsonString);
    if (priceInJsonString) {
        return priceInJsonString
    } else {
        return { "mahadao": { "usd": 2.3 } }
    }
  } catch (e) {
    return null;
  }
}


// StakeARTHXARTH contract for staking ARTHXARTH
export const arthxarth = async () => {
  let arthxPriceRequest = await getArthxPrice()
  let arthxPrice = arthxPriceRequest.arthx.usd
  // console.log('arthxPrice', arthxPrice);
  const reserves = await ArthArthxLP.methods.getReserves().call()
  let arthxarthLPReserve0 = (reserves._reserve0 / 10 ** 18)
  let arthxarthLPReserve1 = (reserves._reserve1 / 10 ** 18)
  console.log('reserves0', arthxarthLPReserve0, 'reserves1', arthxarthLPReserve1);

  let arthxUsdWorth = arthxarthLPReserve0 * arthxPrice
  let arthUsdWorth = arthxarthLPReserve1 * 2

  let sumOfReserve = (arthUsdWorth + arthxUsdWorth)
  let totalSupplyLP = await ArthArthxLP.methods.totalSupply().call() / 10 ** 18

  let LPUSD = sumOfReserve / totalSupplyLP
  let poolTokenArthxBalance = (await arthx.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
  let poolTokenMahaBalance = (await maha.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
  let pooTokenTotalSupply = (await poolToken.methods.totalSupply().call()) / 10 ** 18

  const mahaprice = JSON.parse(await getMahaPrice())
  const PriceOfPoolToken = ((poolTokenArthxBalance * arthxPrice) + (poolTokenMahaBalance * mahaprice.mahadao.usd)) / pooTokenTotalSupply

  const quaterlyRewards = Number(await stakeArthxArth.methods.getRewardForDuration().call())
  let rewardUSD = PriceOfPoolToken * quaterlyRewards / 10 ** 18
  const totalSupply = Number(await stakeArthxArth.methods.totalSupply().call()) / 10 ** 18
  let APY = ((rewardUSD / (totalSupply * LPUSD)) * 100) * 4
  return { APY: APY }
}


export const arthusdc = async () => {
  let arthxPriceRequest = await getArthxPrice()
  let arthxPrice = arthxPriceRequest.arthx.usd

  const reserves = await ArthUsdcLP.methods.getReserves().call()
  let arthusdcLPReserve0 = (reserves._reserve0 / 10 ** 18)
  let arthusdcLPReserve1 = (reserves._reserve1 / 10 ** 18)
  console.log('reserves0', arthusdcLPReserve0, 'reserves1', arthusdcLPReserve1);

  let arthUsdWorth = arthusdcLPReserve0 * 2
  let usdcWorth = arthusdcLPReserve1 * 1

  let sumOfReserve = (arthUsdWorth + usdcWorth)
  let totalSupplyLP = await ArthUsdcLP.methods.totalSupply().call() / 10 ** 18
  let LPUSD = sumOfReserve / totalSupplyLP

  let poolTokenArthxBalance = (await arthx.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
  let poolTokenMahaBalance = (await maha.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
  let pooTokenTotalSupply = (await poolToken.methods.totalSupply().call()) / 10 ** 18

  const mahaprice = JSON.parse(await getMahaPrice())
  const PriceOfPoolToken = ((poolTokenArthxBalance * arthxPrice) + (poolTokenMahaBalance * mahaprice.mahadao.usd)) / pooTokenTotalSupply

  const quaterlyRewards = Number(await stakeArthUsdc.methods.getRewardForDuration().call())
  let rewardUSD = PriceOfPoolToken * quaterlyRewards / 10 ** 18
  const totalSupply = Number(await stakeArthUsdc.methods.totalSupply().call()) / 10 ** 18
  let APY = ((rewardUSD / (totalSupply * LPUSD)) * 100) * 4
  return { APY: APY }
}


// StakeARTHMAHA contract for staking ARTHMAHA
export const arthMaha = async () => {
  let arthxPriceRequest = await getArthxPrice()
  let arthxPrice = arthxPriceRequest.arthx.usd

  const mahaprice = JSON.parse(await getMahaPrice())
  const reserves = await ArthMahaLP.methods.getReserves().call()

  let arthMahaLPReserve0 = (reserves._reserve0 / 10 ** 18)
  let arthMahaLPReserve1 = (reserves._reserve1 / 10 ** 18)

  let arthUsdWorth = arthMahaLPReserve0 * 2
  let mahaUsdWorth = arthMahaLPReserve1 * mahaprice.mahadao.usd
  let sumOfReserve = (arthUsdWorth + mahaUsdWorth)

  let totalSupplyLP = await ArthMahaLP.methods.totalSupply().call() / 10 ** 18
  let LPUSD = sumOfReserve / totalSupplyLP

  let poolTokenArthxBalance = (await arthx.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
  let poolTokenMahaBalance = (await maha.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
  let pooTokenTotalSupply = (await poolToken.methods.totalSupply().call()) / 10 ** 18

  const PriceOfPoolToken = ((poolTokenArthxBalance * arthxPrice) + (poolTokenMahaBalance * mahaprice.mahadao.usd)) / pooTokenTotalSupply
  const quaterlyRewards = Number(await stakeARTHMaha.methods.getRewardForDuration().call())
  let rewardUSD = PriceOfPoolToken * quaterlyRewards / 1e18
  const totalSupply = Number(await stakeARTHMaha.methods.totalSupply().call()) / 10 ** 18

  let APY = ((rewardUSD / (totalSupply * LPUSD)) * 100) * 4
  return { APY: APY }
}

// Not an uniswap pair
// StakeARTHXRMAHA staking contract
export const arthxAPY = async () => {
  try {
    let arthxPriceRequest = await getArthxPrice()
    let arthxPrice = arthxPriceRequest.arthx.usd

    const mahaprice = JSON.parse(await getMahaPrice()) || { "mahadao": { "usd": 2.3 } }
    //console.log('arthxPrice 192', arthxPrice);
    const rewardForDuration = Number(await arthxmahaStakePool.methods.getRewardForDuration().call())
    const totalSupply = await arthxmahaStakePool.methods.totalSupply().call()

    let rewardUSD = mahaprice.mahadao.usd * rewardForDuration / 10 ** 18
    let totalSupplyUSD = (totalSupply / 10 ** 18) * arthxPrice
    let APY = ((rewardUSD / totalSupplyUSD) * 100) * 52
    return { APY: APY }
  } catch (e) {
    console.log(e);
  }
}


// StakeARTH staking contract
export const arthAPY = async () => {
  try {
    let arthxPriceRequest = await getArthxPrice()
    let arthxPrice = arthxPriceRequest.arthx.usd

    const mahaprice = JSON.parse(await getMahaPrice()) || { "mahadao": { "usd": 2.3 } }
    const rewardForDuration = Number(await stakeARTH.methods.getRewardForDuration().call())
    const totalSupply = await stakeARTH.methods.totalSupply().call()

    let poolTokenArthxBalance = (await arthx.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
    let poolTokenMahaBalance = (await maha.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
    let pooTokenTotalSupply = (await poolToken.methods.totalSupply().call()) / 10 ** 18

    const PriceOfPoolToken = ((poolTokenArthxBalance * arthxPrice) + (poolTokenMahaBalance * mahaprice.mahadao.usd)) / pooTokenTotalSupply
    let rewardUSD = PriceOfPoolToken * rewardForDuration / 10 ** 18
    let totalSupplyUSD = (totalSupply / 10 ** 18) * 2

    let APY = ((rewardUSD / totalSupplyUSD) * 100) * 4
    return { APY: APY }
  } catch (e) {
    console.log(e);
  }
}


//StakeARTHX staking contract
export const basicStakingArthx = async () => {
  try {
    let arthxPriceRequest = await getArthxPrice()
    let arthxPrice = arthxPriceRequest.arthx.usd
    //console.log(arthxPrice);
    const mahaprice = JSON.parse(await getMahaPrice())
    let poolTokenArthxBalance = (await arthx.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
    let poolTokenMahaBalance = (await maha.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
    let pooTokenTotalSupply = (await poolToken.methods.totalSupply().call()) / 10 ** 18
    const PriceOfPoolToken = ((poolTokenArthxBalance * arthxPrice) + (poolTokenMahaBalance * mahaprice.mahadao.usd)) / pooTokenTotalSupply

    const rewardForDuration = Number(await stakeARTHX.methods.getRewardForDuration().call())
    const totalSupply = await stakeARTHX.methods.totalSupply().call()
    let rewardUSD = PriceOfPoolToken * rewardForDuration / 10 ** 18
    let totalSupplyUSD = (totalSupply / 10 ** 18) * arthxPrice

    let APY = ((rewardUSD / totalSupplyUSD) * 100) * 4
    return { APY: APY }
  } catch (e) {
      console.log(e);
  }
}

// StakeMaha contract
export const basicStakingMaha = async () => {
  try {
    let arthxPrice = await getArthxPrice()
    const mahaprice = JSON.parse(await getMahaPrice())
    const rewardForDuration = Number(await stakeMaha.methods.getRewardForDuration().call())
    const totalSupply = await stakeMaha.methods.totalSupply().call()

    let poolTokenArthxBalance = (await arthx.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
    let poolTokenMahaBalance = (await maha.methods.balanceOf(poolTokenAddress).call()) / 10 ** 18
    let pooTokenTotalSupply = (await poolToken.methods.totalSupply().call()) / 10 ** 18

    const PriceOfPoolToken = ((poolTokenArthxBalance * arthxPrice) + (poolTokenMahaBalance * mahaprice.mahadao.usd)) / pooTokenTotalSupply
    let rewardUSD = PriceOfPoolToken * rewardForDuration / 10 ** 18
    let totalSupplyUSD = (totalSupply / 10 ** 18) * mahaprice.mahadao.usd

    let APY = ((rewardUSD / totalSupplyUSD) * 100) * 4
    return { APY: APY }
  } catch (e) {
      console.log(e);
  }
}


export const allAPY = async (req, res) => {
  let arthxarthApy = await arthxarth()
  let arthmahaApy = await arthMaha()
  let arthusdcApy = await arthusdc()
  let arthxrmahaApy = await arthxAPY()
  let arthxApy = await basicStakingArthx()
  let arthApy = await arthAPY()
  let mahaApy = await basicStakingMaha()

  res.send({
    arthxarthApy: arthxarthApy,
    arthmahaApy: arthmahaApy,
    arthusdcApy: arthusdcApy,
    arthxrmahaApy: arthxrmahaApy,
    arthxApy: arthxApy,
    arthApy: arthApy,
    mahaApy: mahaApy
  })
}


export const sendResponse = async (req, res) => {
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
      res.send({ APY: null })
  }
}
