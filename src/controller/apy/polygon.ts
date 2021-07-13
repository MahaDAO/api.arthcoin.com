import { nextTick } from "process";
import { web3 } from "../../web3";
import { getCollateralPrices, ICollatearlPrices } from "./coingecko";

// ABIs
const ArthController = require('../../web3/deployments/customAddedAbi/arthController.json')
const BasicStakingABI = require('../../web3/deployments/abi/BasicStaking.json')
const UniswapV2PairABI = require('../../web3/deployments/abi/UniswapV2Pair.json')
const PoolTokenABI = require('../../web3/deployments/abi/PoolToken.json')
const ArthSharesABI = require('../../web3/deployments/abi/ARTHShares.json')
const MahaTokenABI = require('../../web3/deployments/abi/MahaToken.json')

const tokenAddresses = {
  arthx: '0xD354D56DaE3588F1145dd664bc5094437b889d6F',
  arth: '0xE52509181FEb30EB4979E29EC70D50FD5C44D590',
  maha: '0xeDd6cA8A4202d4a36611e2fff109648c4863ae19',
  usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  poolToken: '0x963911186972433fFF9FE2aA5959dA3918456B59',

  arthArthxLP: '0x742146b6241B779f7fb9759E7F45772597B08DF1',
  arthMahaLP: '0xd10f5Bb8DE9fDeD024F0D995793B750D207095Fc',
  arthUsdcLP: '0xe11bd5a3927A2a4e55266959B348c39bA9eaECD4',
}

const stakingAddresses = {
  stakeArthxArth: '0xF59Cd4B9Cc341E6650ABB1288C5aC01e9f37f9b5',
  stakeARTH: '0xF4de24E6393793E44Bd69e8b888828995A61E08A',
  stakeARTHMaha: '0x9c5D406623aA49ACbE982E20F995a710Af4e5EC9',
  stakeARTHX: '0x17594C5a5305a5Ba032012AedD5bBd5906852020',
  stakeMaha: '0x65Ec8480D686E26c7E2AB2b0932CbacD5DaEdd2E',
  stakeArthUsdc: '0x99547b2E9DF856760918ad63dA09795dC1a0F3Fd',
}

const tokenDecimals = {
  USDC: 6,
  USDT: 6,
  ETH: 18,
  ARTH: 18,
  ARTHX: 18,
  MAHA: 18
}

// contracts
const arthcontroller = new web3.eth.Contract(ArthController, '0x8604E0606245184c619830f9E795aea01F7A3d38')
const arthx = new web3.eth.Contract(ArthSharesABI, tokenAddresses.arthx)
const maha = new web3.eth.Contract(MahaTokenABI, tokenAddresses.maha)
const poolToken = new web3.eth.Contract(PoolTokenABI, tokenAddresses.poolToken)


let lastRecordedARTHXPrice = 0.000573
export const getArthxPrice = async () => {
  try {
    let arthxPriceFromController = await arthcontroller.methods.getARTHXPrice().call()
    if (!arthxPriceFromController) return lastRecordedARTHXPrice
    lastRecordedARTHXPrice = arthxPriceFromController / 1e6
  } catch (e) {
    // ignore
  }
  return lastRecordedARTHXPrice
}

const _getUSDValueOfOneLPToken = async (collateralPrices: ICollatearlPrices, lpToken: string, token1: string, token2: string) => {
  const token1Price = collateralPrices[token1]
  const token2Price = collateralPrices[token2]

  const LPContract = new web3.eth.Contract(UniswapV2PairABI, lpToken)

  const reserves = await LPContract.methods.getReserves().call()
  const isR0Token0 = await LPContract.methods.token0().call() === tokenAddresses[token1]

  const token1Balance = isR0Token0 ? reserves[0] : reserves[1]
  const token2Balance = isR0Token0 ? reserves[1] : reserves[0]

  const token1BalanceNormalized = (token1Balance / 10 ** tokenDecimals[token1])
  const token2BalanceNormalized = (token2Balance / 10 ** tokenDecimals[token2])

  const totalUSDvalue = token1BalanceNormalized * token1Price + token2BalanceNormalized * token2Price;
  const totalSupplyLP = await LPContract.methods.totalSupply().call() / 10 ** 18

  return totalUSDvalue / totalSupplyLP
}

const _getUSDValueOfOnePoolToken = async (collateralPrices: ICollatearlPrices) => {
  const poolTokenArthxBalance = (await arthx.methods.balanceOf(tokenAddresses.poolToken).call()) / 10 ** 18
  const poolTokenMahaBalance = (await maha.methods.balanceOf(tokenAddresses.poolToken).call()) / 10 ** 18

  const mahaPrice = collateralPrices.MAHA
  const arthxPrice = collateralPrices.ARTHX

  const totalUSDValue = ((poolTokenArthxBalance * arthxPrice) + (poolTokenMahaBalance * mahaPrice))
  const totalSupplyLP = await poolToken.methods.totalSupply().call() / 10 ** 18
  return totalUSDValue / totalSupplyLP
}

const _getAPYforLPBasicStakingContract = async (collateralPrices: ICollatearlPrices, contract: string, lpToken: string, token1: string, token2: string, quarters: number) => {
  const stakingContract = new web3.eth.Contract(BasicStakingABI, contract)

  const priceOfOneLPToken = await _getUSDValueOfOneLPToken(collateralPrices, lpToken, token1, token2)
  const priceOfOnePoolToken = await _getUSDValueOfOnePoolToken(collateralPrices)

  const rewardTokensRemaining = (await poolToken.methods.balanceOf(contract).call()) / 10 ** 18
  const totalLockedTokenValue = Number(await stakingContract.methods.totalSupply().call()) / 10 ** 18

  const rewardUSD = priceOfOnePoolToken * rewardTokensRemaining
  const totalUSDValueLocked = priceOfOneLPToken * totalLockedTokenValue

  return (rewardUSD / totalUSDValueLocked * 100) * quarters
}

const _getAPYforBasicStakingContract = async (collateralPrices: ICollatearlPrices, contract: string, token1: string, quarters: number) => {
  const stakingContract = new web3.eth.Contract(BasicStakingABI, contract)

  const priceOfToken = collateralPrices[token1]
  const priceOfOnePoolToken = await _getUSDValueOfOnePoolToken(collateralPrices)

  const rewardTokensRemaining = (await poolToken.methods.balanceOf(contract).call()) / 10 ** 18
  const totalLockedTokenValue = Number(await stakingContract.methods.totalSupply().call()) / 10 ** 18

  const rewardUSD = priceOfOnePoolToken * rewardTokensRemaining
  const totalUSDValueLocked = priceOfToken * totalLockedTokenValue

  return (rewardUSD / totalUSDValueLocked * 100) * quarters
}

export const arthxarthQ3 = async (collateralPrices: ICollatearlPrices) => {
  return _getAPYforLPBasicStakingContract(collateralPrices, stakingAddresses.stakeArthxArth, tokenAddresses.arthArthxLP, 'ARTH', 'ARTHX', 4)
}

export const arthusdcQ3 = async (collateralPrices: ICollatearlPrices) => {
  return _getAPYforLPBasicStakingContract(collateralPrices, stakingAddresses.stakeArthUsdc, tokenAddresses.arthUsdcLP, 'ARTH', 'USDC', 4)
}

export const arthMahaQ3 = async (collateralPrices: ICollatearlPrices) => {
  return _getAPYforLPBasicStakingContract(collateralPrices, stakingAddresses.stakeARTHMaha, tokenAddresses.arthMahaLP, 'ARTH', 'MAHA', 4)
}

export const arthBasicQ3 = async (collateralPrices: ICollatearlPrices) => {
  return _getAPYforBasicStakingContract(collateralPrices, stakingAddresses.stakeARTH, 'ARTH', 4)
}

export const arthxBasicQ3 = async (collateralPrices: ICollatearlPrices) => {
  return _getAPYforBasicStakingContract(collateralPrices, stakingAddresses.stakeARTHX, 'ARTHX', 4)
}

export const mahaBasicQ3 = async (collateralPrices: ICollatearlPrices) => {
  return _getAPYforBasicStakingContract(collateralPrices, stakingAddresses.stakeMaha, 'MAHA', 4)
}


let cache: any = {}
const job = async () => {
  const collateralPrices = await getCollateralPrices();
  collateralPrices.ARTHX = await getArthxPrice();

  try {
    cache = {
      arthxarthApy: await arthxarthQ3(collateralPrices),
      arthmahaApy: await arthMahaQ3(collateralPrices),
      arthusdcApy: await arthusdcQ3(collateralPrices),
      arthxApy: await arthxBasicQ3(collateralPrices),
      arthApy: await arthBasicQ3(collateralPrices),
      mahaApy: await mahaBasicQ3(collateralPrices),
    }

    console.log('done')
  } catch (error) {
    console.log(error, error.message)
  }
}

setInterval(job, 5 * 60 * 1000) // 5min cache
job()

export default async (_req, res) => res.json(cache)

