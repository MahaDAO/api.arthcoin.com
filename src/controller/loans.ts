import { polygonProvider, bscProvider } from "../web3";
import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";

import {
  getCollateralPrices,
  CollateralKeys,
  ICollateralPrices,
} from "./coingecko";

const cache = new NodeCache();

// ABIs
const BasicStakingABI = require("../abi/BasicStaking.json");
const IERC20 = require("../abi/IERC20.json");

const bsc = {
  arthBusdStaking: "0xE8b16cab47505708a093085926560a3eB32584B8",
  arthMahaStaking: "0x7699d230Ba47796fc2E13fba1D2D52Ecb0318c33",
  arthMahaLP: "0xb955d5b120ff5b803cdb5a225c11583cd56b7040",
  arthBusdLP: "0x80342bc6125a102a33909d124a6c26CC5D7b8d56",
  busd: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
  arth: "0xb69a424df8c737a122d0e60695382b3eec07ff4b",
  maha: "0xCE86F7fcD3B40791F63B86C3ea3B8B355Ce2685b",
};

const polygon = {
  arthUsdcStaking: "0xD585bfCF37db3C2507e2D44562F0Dbe2E4ec37Bc",
  arthMahaStaking: "0xC82c95666bE4E89AED8AE10bab4b714cae6655d5",
  arthMahaLP: "0x95de8efD01dc92ab2372596B3682dA76a79f24c3",
  arthUsdcLP: "0x34aAfA58894aFf03E137b63275aff64cA3552a3E",
  usdc: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
  arth: "0xe52509181feb30eb4979e29ec70d50fd5c44d590",
  maha: "0xedd6ca8a4202d4a36611e2fff109648c4863ae19",
};

const tokenDecimals: ICollateralPrices = {
  ARTH: 18,
  WBTC: 18,
  BUSD: 18,
  WETH: 18,
  USDT: 6,
  MAHA: 18,
  SCLP: 18,
  USDC: 6,
};

const getAPR = async (
  contractTVLinUSD: number,
  monthlyRewardinMAHA: number,
  collateralPrices: ICollateralPrices
) => {
  const rewardinUSD = 12 * monthlyRewardinMAHA * collateralPrices.MAHA;
  return (rewardinUSD / contractTVLinUSD) * 100;
};

const getLPTokenTVLinUSD = async (
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

  //   const poolTokenUsdcBalance =
  //   (await usdcPolygon.balanceOf(
  //     "0x34aAfA58894aFf03E137b63275aff64cA3552a3E"
  //   )) /
  //   10 ** 18;
  // const poolTokenArthBalance =
  //   (await arthPolygon.balanceOf(
  //     "0x34aAfA58894aFf03E137b63275aff64cA3552a3E"
  //   )) /
  //   10 ** 18;

  // const usdcPrice = collateralPrices.USDC;
  // const arthPrice = collateralPrices.ARTH;

  // const totalUSDValue =
  //   poolTokenUsdcBalance * usdcPrice + poolTokenArthBalance * arthPrice;

  // let totalSupplyLP = (await arthUsdcLPPolygon.totalSupply()) / 10 ** 18;

  // return totalUSDValue / totalSupplyLP;
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

  const lpTokenTVLinUSD = await getLPTokenTVLinUSD(
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
  console.log("here new farm");

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

  return {
    chainSpecificData: {
      137: {
        apr: {
          arthUsdc: await getAPR(arthUsdcPolygonTVL, 5000, collateralPrices),
          arthMaha: await getAPR(arthMahaPolygonTVL, 5000, collateralPrices),
        },
        tvl: {
          arthMaha: arthMahaPolygonTVL,
          arthUsdc: arthUsdcPolygonTVL,
        },
      },
      56: {
        apr: {
          arthBusd: await getAPR(arthBuscBscTVL, 5000, collateralPrices),
          arthMaha: await getAPR(arthMahaBscTVL, 5000, collateralPrices),
        },
        tvl: {
          arthBusd: arthBuscBscTVL,
          arthMaha: arthMahaBscTVL,
        },
      },
    },
    mahaRewardPerMinute: 5000 / (86400 * 30),
  };
};

export default async (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200);

  // 1 min cache
  if (cache.get("loans-apr")) {
    res.send(cache.get("loans-apr"));
  } else {
    const data = await fetchAPRs();
    cache.set("loans-apr", JSON.stringify(data), 60);
    res.send(JSON.stringify(data));
  }
};
