import { polygonProvider, bscProvider, polygonTestnetProvider } from "../web3";
import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";
import cron from "node-cron";

import {
  getCollateralPrices,
  CollateralKeys,
  ICollateralPrices,
} from "./coingecko";

const cache = new NodeCache();

// ABIs
const BasicStakingABI = require("../abi/BasicStaking.json");
const IERC20 = require("../abi/IERC20.json");
const TroveManager = require("../abi/TroveManager.json")
const priceFeed = require("../abi/PriceFeed.json");

const bsc = {
  arthu3epsStakingV2: "0x6398c73761a802a7db8f6418ef0a299301bc1fb0",
  arthBusdStaking: "0xE8b16cab47505708a093085926560a3eB32584B8",
  arthMahaStaking: "0x7699d230Ba47796fc2E13fba1D2D52Ecb0318c33",
  arthu3epsStaking: "0x8fF204D06B39a19Bd8c8367302bfCB329214c14B",
  arthu3epsLP: "0xB38B49bAE104BbB6A82640094fd61b341a858f78",
  arthMahaLP: "0xb955d5b120ff5b803cdb5a225c11583cd56b7040",
  arthBusdLP: "0x80342bc6125a102a33909d124a6c26CC5D7b8d56",
  busd: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
  arth: "0xb69a424df8c737a122d0e60695382b3eec07ff4b",
  maha: "0xCE86F7fcD3B40791F63B86C3ea3B8B355Ce2685b",
  "arth.usd": "0x88fd584dF3f97c64843CD474bDC6F78e398394f4",
  "bsc.3eps": "0xaf4de8e872131ae328ce21d909c74705d3aaf452",
};

const polygon = {
  arthu3poolStaking: "0x245AE0bBc1E31e7279F0835cE8E93127A13a3781",
  arthu3poolLP: "0xDdE5FdB48B2ec6bc26bb4487f8E3a4EB99b3d633",
  arthUsdcStaking: "0xD585bfCF37db3C2507e2D44562F0Dbe2E4ec37Bc",
  arthMahaStaking: "0xC82c95666bE4E89AED8AE10bab4b714cae6655d5",
  arthMahaLP: "0x95de8efD01dc92ab2372596B3682dA76a79f24c3",
  arthUsdcLP: "0x34aAfA58894aFf03E137b63275aff64cA3552a3E",
  usdc: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
  "arth.usd": "0x84f168e646d31F6c33fDbF284D9037f59603Aa28",
  "polygon.3pool": "0x19793b454d3afc7b454f206ffe95ade26ca6912c",
  arth: "0xe52509181feb30eb4979e29ec70d50fd5c44d590",
  maha: "0xedd6ca8a4202d4a36611e2fff109648c4863ae19",
  troveManager: "0xe5EfD185Bd7c288e270bA764E105f8964aAecd41",
  priceFeed: "0x935c70e4B9371f63A598BdA58BF1B2b270C8eBFe"
};

const tokenDecimals: ICollateralPrices = {
  ARTH: 18,
  WBTC: 18,
  "ARTH.usd": 18,
  "polygon.3pool": 18,
  BUSD: 18,
  DAI: 18,
  WETH: 18,
  "bsc.3eps": 18,
  USDT: 6,
  MAHA: 18,
  SCLP: 18,
  USDC: 6,
};

const wallet = new ethers.Wallet(
  process.env.WALLET_KEY,
  polygonTestnetProvider
)

const getAPR = async (
  contractTVLinUSD: number,
  monthlyRewardinMAHA: number,
  collateralPrices: ICollateralPrices
) => {
  const rewardinUSD = 12 * monthlyRewardinMAHA * collateralPrices.MAHA;
  return (rewardinUSD / contractTVLinUSD) * 100;
};

const getEllipsisLPTokenTVLinUSD = async (
  stableSwapAddress: string,
  lpAddress: string,
  tokenAddresses: string[],
  tokenNames: string[],
  collateralPrices: ICollateralPrices,
  provider: ethers.providers.Provider
) => {
  const token1 = new ethers.Contract(tokenAddresses[0], IERC20, provider);
  const token2 = new ethers.Contract(tokenAddresses[1], IERC20, provider);

  const token1Balance: BigNumber = await token1.balanceOf(stableSwapAddress);
  const token2Balance: BigNumber = await token2.balanceOf(stableSwapAddress);

  const token1Decimals = BigNumber.from(10).pow(tokenDecimals[tokenNames[0]]);
  const token2Decimals = BigNumber.from(10).pow(tokenDecimals[tokenNames[1]]);

  const token1Amount = token1Balance.div(token1Decimals);
  const token2Amount = token2Balance.div(token2Decimals);

  const token1USDValue = token1Amount
    .mul(Math.floor(1000 * collateralPrices[tokenNames[0]]))
    .div(1000);
  const token2USDValue = token2Amount
    .mul(Math.floor(1000 * collateralPrices[tokenNames[1]]))
    .div(1000);

  // total usd in the LP token
  return token1USDValue.add(token2USDValue);
};

const getUniswapLPTokenTVLinUSD = async (
  lpAddress: string,
  tokenAddresses: string[],
  tokenNames: string[],
  collateralPrices: ICollateralPrices,
  provider: ethers.providers.Provider
) => {
  const token1 = new ethers.Contract(tokenAddresses[0], IERC20, provider);
  const token2 = new ethers.Contract(tokenAddresses[1], IERC20, provider);

  const token1Balance: BigNumber = await token1.balanceOf(lpAddress);
  const token2Balance: BigNumber = await token2.balanceOf(lpAddress);

  const token1Decimals = BigNumber.from(10).pow(tokenDecimals[tokenNames[0]]);
  const token2Decimals = BigNumber.from(10).pow(tokenDecimals[tokenNames[1]]);

  const token1Amount = token1Balance.div(token1Decimals);
  const token2Amount = token2Balance.div(token2Decimals);

  const token1USDValue = token1Amount
    .mul(Math.floor(1000 * collateralPrices[tokenNames[0]]))
    .div(1000);
  const token2USDValue = token2Amount
    .mul(Math.floor(1000 * collateralPrices[tokenNames[1]]))
    .div(1000);

  // total usd in the LP token
  return token1USDValue.add(token2USDValue);
};

const getTVL = async (
  stakingContractAddress: string,
  lpAddress: string,
  tokenAddresses: string[],
  tokenNames: CollateralKeys[],
  collateralPrices: ICollateralPrices,
  provider: ethers.providers.Provider
) => {
  const stakingContract = new ethers.Contract(
    stakingContractAddress,
    BasicStakingABI,
    provider
  );

  const lpToken = new ethers.Contract(lpAddress, IERC20, provider);

  const lpTokenTVLinUSD =
    lpAddress !== bsc.arthu3epsLP
      ? await getUniswapLPTokenTVLinUSD(
          lpAddress,
          tokenAddresses,
          tokenNames,
          collateralPrices,
          provider
        )
      : await getEllipsisLPTokenTVLinUSD(
          "0x98245Bfbef4e3059535232D68821a58abB265C45",
          lpAddress,
          tokenAddresses,
          tokenNames,
          collateralPrices,
          provider
        );

  const totalSupply: BigNumber = await lpToken.totalSupply();
  const stakedAmount: BigNumber = await stakingContract.totalSupply();

  const percentageStaked = stakedAmount.mul(1000000).div(totalSupply);
  const stakedUSD = percentageStaked.mul(lpTokenTVLinUSD).div(1000000);
  return stakedUSD.toNumber();
};

const fetchAPRs = async () => {
  const collateralPrices = await getCollateralPrices();

  const arthMahaBscTVL = await getTVL(
    bsc.arthMahaStaking,
    bsc.arthMahaLP,
    [bsc.arth, bsc.maha],
    ["ARTH", "MAHA"],
    collateralPrices,
    bscProvider
  );

  const arthBuscBscTVL = await getTVL(
    bsc.arthBusdStaking,
    bsc.arthBusdLP,
    [bsc.arth, bsc.busd],
    ["ARTH", "BUSD"],
    collateralPrices,
    bscProvider
  );

  const arthMahaPolygonTVL = await getTVL(
    polygon.arthMahaStaking,
    polygon.arthMahaLP,
    [polygon.arth, polygon.maha],
    ["ARTH", "MAHA"],
    collateralPrices,
    polygonProvider
  );

  const arthUsdcPolygonTVL = await getTVL(
    polygon.arthUsdcStaking,
    polygon.arthUsdcLP,
    [polygon.arth, polygon.usdc],
    ["ARTH", "USDC"],
    collateralPrices,
    polygonProvider
  );

  const arthu3poolPolygonTVL = await getTVL(
    polygon.arthu3poolStaking,
    polygon.arthu3poolLP,
    [polygon["arth.usd"], polygon["polygon.3pool"]],
    ["ARTH.usd", "polygon.3pool"],
    collateralPrices,
    polygonProvider
  );

  const arthu3epsBscTVL = await getTVL(
    bsc.arthu3epsStaking,
    bsc.arthu3epsLP,
    [bsc["arth.usd"], bsc["bsc.3eps"]],
    ["ARTH.usd", "bsc.3eps"],
    collateralPrices,
    bscProvider
  );

  const arthu3epsV2BscTVL = await getTVL(
    bsc.arthu3epsStakingV2,
    bsc.arthu3epsLP,
    [bsc["arth.usd"], bsc["bsc.3eps"]],
    ["ARTH.usd", "bsc.3eps"],
    collateralPrices,
    bscProvider
  );

  return {
    chainSpecificData: {
      137: {
        apr: {
          arthu3pool: await getAPR(
            arthu3poolPolygonTVL,
            5000,
            collateralPrices
          ),
          arthUsdc: await getAPR(arthUsdcPolygonTVL, 5000, collateralPrices),
          arthMaha: await getAPR(arthMahaPolygonTVL, 5000, collateralPrices),
        },
        tvl: {
          arthu3pool: arthu3poolPolygonTVL,
          arthMaha: arthMahaPolygonTVL,
          arthUsdc: arthUsdcPolygonTVL,
        },
      },
      56: {
        apr: {
          // arthu3eps: await getAPR(arthu3epsBscTVL, 5000, collateralPrices),
          "arthu3eps-v2": await getAPR(
            arthu3epsV2BscTVL,
            6000,
            collateralPrices
          ),
          arthBusd: await getAPR(arthBuscBscTVL, 5000, collateralPrices),
          arthMaha: await getAPR(arthMahaBscTVL, 5000, collateralPrices),
        },
        tvl: {
          "arthu3eps-v2": arthu3epsV2BscTVL,
          arthu3eps: arthu3epsBscTVL,
          arthBusd: arthBuscBscTVL,
          arthMaha: arthMahaBscTVL,
        },
      },
    },
    mahaRewardPerMinute: 5000 / (86400 * 30),
  };
};

const usdcUsdtQLP = async (
  provider: ethers.providers.Provider
) => {
  const troveManager = new ethers.Contract(polygon.troveManager, TroveManager, polygonTestnetProvider);
  const collateralRaised = await troveManager.getEntireSystemColl();

  //console.log('collateralRaised', collateralRaised);
  return { collateralRaised : collateralRaised }
}

const fetchAndCache = async () => {
  const data = await fetchAPRs();
  const qlpTvl = await usdcUsdtQLP(polygonTestnetProvider);
  cache.set("loans-apr", JSON.stringify(data));
  cache.set("loan-qlp-tvl", JSON.stringify(qlpTvl));
};

cron.schedule("0 * * * * *", fetchAndCache); // every minute
fetchAndCache();

export default async (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200);

  // 1 min cache
  if (cache.get("loans-apr")) {
    res.send(cache.get("loans-apr"), cache.get("loan-qlp-tvl"));
  } else {
    await fetchAndCache();
    res.send(cache.get("loans-apr"));
  }
};
