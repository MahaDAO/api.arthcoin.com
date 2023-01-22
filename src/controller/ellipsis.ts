import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/evm-utils";
import { ethProvider } from "../web3";
import { ethers, BigNumber } from "ethers";
import NodeCache from "node-cache";
import cron from "node-cron";

import * as Bluebird from "bluebird";
import _, { map } from "underscore";

import { getCollateralPrices, ICollateralPrices } from "../utils/coingecko";

const request = require("request-promise");
const NFT = require("../abi/nftABI.json");
const FACTORY = require("../abi/factory.json");
const IERC20 = require("../abi/IERC20.json");
const GMUOracle = require("../abi/GMUOracle.json");

const uniswapNftManager = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
const chain = EvmChain.ETHEREUM;

const cache = new NodeCache();

const guageAddresses = {
  ARTHUSDCGauge: "0x174327F7B7A624a87bd47b5d7e1899e3562646DF", // calculate rewards remaining here
  ARTHMAHAGauge: "0x48165A4b84e00347C4f9a13b6D0aD8f7aE290bB8", // calculate rewards remaining here
  ARTHUSDCPool: "0x031a1d307C91fbDE01005Ec2Ebc5Fcb03b6f80aB",
  ARTHMAHAPool: "0xC5Ee69662e7EF79e503be9D54C237d5aafaC305d",
};

//export const getRewardRemaing = async (collateralPrices, address) => {
export const getRewardRemaing = async (amount, collateralPrices) => {
  const maha = new ethers.Contract(
    "0xb4d930279552397bba2ee473229f89ec245bc365",
    IERC20,
    ethProvider
  );

  //const balance = await maha.balanceOf(address)
  // const balance = await maha.balanceOf('0x736a089Ad405f1C35394Ad15004f5359938f771e')

  // const mahaUSD = (Number(balance / 1e18) * collateralPrices['MAHA'])
  return amount * collateralPrices["MAHA"]; //Number(mahaUSD)
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

  return Number(token1USDValue.add(token2USDValue));
};

const getAPR = async (contractTVLinUSD: number, weeklyRewardinMAHA) => {
  const rewardinUSD = 52 * weeklyRewardinMAHA;
  return (rewardinUSD / contractTVLinUSD) * 100;
};

const nftV3 = async (guageAddress) => {
  await Moralis.start({
    apiKey: "sWWpwWUpyEqnZtM8PawuTsxSIUYgVmmR4KoKSWKuDgRiIbCE7kjLLe0nGhgQVsIl",
    // ...and any other configuration
  });

  const rewardContract = new ethers.Contract(
    "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    NFT,
    ethProvider
  );

  const factory = new ethers.Contract(
    "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    FACTORY,
    ethProvider
  );

  // const response = await nftManagerContract.balanceOf({
  //     address
  // });

  const response = await Moralis.EvmApi.account.getNFTsForContract({
    address: guageAddress,
    tokenAddress: uniswapNftManager,
    chain,
  });

  const nftArray = response.result;
  // console.log('nftArray', nftArray);

  let tokenId = [];
  let positions = [];

  await Bluebird.mapSeries(nftArray, async (data) => {
    tokenId.push(data._data.tokenId);
  });

  //console.log(tokenId);

  await Bluebird.mapSeries(tokenId, async (data) => {
    const postionData = await rewardContract.positions(data);
    positions.push(postionData);
  });

  //console.log(positions);
  let lpTokenAddress = [];
  await Bluebird.mapSeries(positions, async (data) => {
    const lpAddress = await factory.getPool(data.token0, data.token1, data.fee);
    lpTokenAddress.push({
      lpAddress: lpAddress,
      token0: data.token0,
      token1: data.token1,
      token0Name: await getTokenName(data.token0),
      token1Name: await getTokenName(data.token1),
    });
  });

  //console.log('lpTokenAddress', lpTokenAddress);

  let allLPAddress = [
    ...new Map(
      lpTokenAddress.map((item) => [item["lpAddress"], item])
    ).values(),
  ];

  let lPUsdWorth;
  const collateralPrices = await getCollateralPrices();
  await Bluebird.mapSeries(allLPAddress, async (data, i) => {
    lPUsdWorth = await getUniswapLPTokenTVLinUSD(
      data.lpAddress,
      [data.token0, data.token1],
      [data.token0Name, data.token1Name],
      collateralPrices,
      ethProvider
    );
  });

  //console.log(lPUsdWorth);

  let rewards;
  if (guageAddress == guageAddresses.ARTHMAHAGauge) {
    rewards = await getRewardRemaing(1800, collateralPrices);
  } else if (guageAddress == guageAddresses.ARTHUSDCGauge) {
    rewards = await getRewardRemaing(200, collateralPrices);
  }

  console.log("rewards", rewards);

  let APY = await getAPR(lPUsdWorth, rewards);
  //console.log(APY);

  return APY / 5;
};

const getMahalendRewards = async () => {
  const yearlyRewards = 12000;
  const collateralPrices = await getCollateralPrices();
  const mahaPrice = collateralPrices["MAHA"];
  const mahalendArth = new ethers.Contract(
    "0xe6b683868d1c168da88cfe5081e34d9d80e4d1a6",
    IERC20,
    ethProvider
  );

  const gmuContract = new ethers.Contract(
    "0x7EE5010Cbd5e499b7d66a7cbA2Ec3BdE5fca8e00",
    GMUOracle,
    ethProvider
  );
  const totalSupply = Number((await mahalendArth.totalSupply()) / 1e18);
  const arthPrice = Number((await gmuContract.fetchLastGoodPrice()) / 1e18);
  const rewardPercent =
    ((yearlyRewards * mahaPrice) / (arthPrice * totalSupply)) * 100;
  return rewardPercent;
};

const options = (method, url) => {
  return {
    method: method,
    uri: url,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    json: true,
  };
};

const scrappedApyRequest = async () => {
  const ellipsisApy = await request(
    options("GET", "https://api.ellipsis.finance/api/getAPRs")
  );
  const ellipsisData = ellipsisApy.data["9"];

  const dotApy = await request(
    options("GET", "https://api.dotdot.finance/api/lpDetails")
  );
  const dotData = dotApy.data.tokens[34];

  const stabilityApy = await request(
    options("GET", "https://api.arthcoin.com/apy/stability")
  );
  //console.log(stabilityApy);

  const arthEthStrategy = await request(
    options("GET", "https://api.arthcoin.com/apy/campaign")
  );

  const mahalendRewards = await getMahalendRewards();

  // console.log({
  //     "ellipsis-0x21dE718BCB36F649E1A7a7874692b530Aa6f986d" : {
  //         min : String(ellipsisData.totalApr),
  //         max : String(ellipsisData.aprWithBoost)
  //     },
  //     "dot-0x21dE718BCB36F649E1A7a7874692b530Aa6f986d" : {
  //         min : ( String(dotData.minEpxAPR + dotData.minDddAPR) ),
  //         max : ( String(dotData.realDddAPR + dotData.realEpxAPR) )
  //     },
  //     "stability-eth" : {
  //         min: String(stabilityApy.eth),
  //         max: String(0)
  //     },
  //     "stability-bnb" : {
  //         min: String(stabilityApy.bnb),
  //         max: String(0)
  //     }
  // });

  return {
    "ellipsis-0x21dE718BCB36F649E1A7a7874692b530Aa6f986d": {
      min: String(ellipsisData.totalApr),
      max: String(ellipsisData.aprWithBoost),
    },
    "dot-0x21dE718BCB36F649E1A7a7874692b530Aa6f986d": {
      min: String(dotData.minEpxAPR + dotData.minDddAPR),
      max: String(dotData.realDddAPR + dotData.realEpxAPR),
    },
    "stability-eth": {
      min: String(stabilityApy.eth.apr),
      max: String(0),
    },
    "stability-bnb": {
      min: String(stabilityApy.bnb.apr),
      max: String(0),
    },
    "arth-eth-strategy": {
      min: String(arthEthStrategy["arth-eth-loans"]),
      max: String(0),
    },
    "arth-mahalend": {
      min: String(mahalendRewards),
      max: String(0),
    },
  };
};

scrappedApyRequest();

const fetchAndCache = async () => {
  // const arthUsdcApy = await nftV3(guageAddresses.ARTHUSDCGauge);
  // const arthMahaApy = await nftV3(guageAddresses.ARTHMAHAGauge);
  const scrappedApy = await scrappedApyRequest();
  console.log(scrappedApy);

  // console.log('nft v3 apy', {
  //     'uniswap-0x174327F7B7A624a87bd47b5d7e1899e3562646DF': { min: 22.5, max: 22.5 * 5 },
  //     'uniswap-0x48165A4b84e00347C4f9a13b6D0aD8f7aE290bB8': { min: 150, max: 150 * 5 },
  //     'ellipsis-0x21dE718BCB36F649E1A7a7874692b530Aa6f986d': scrappedApy['ellipsis-0x21dE718BCB36F649E1A7a7874692b530Aa6f986d'],
  //     'dot-0x21dE718BCB36F649E1A7a7874692b530Aa6f986d': scrappedApy['dot-0x21dE718BCB36F649E1A7a7874692b530Aa6f986d'],
  //     'stability-eth': scrappedApy['stability-eth']
  // });

  cache.set(
    "guageV3-apr",
    JSON.stringify({
      "uniswap-0x174327F7B7A624a87bd47b5d7e1899e3562646DF": {
        min: String(22.5),
        max: String(22.5 * 5),
      },
      "uniswap-0x48165A4b84e00347C4f9a13b6D0aD8f7aE290bB8": {
        min: String(150),
        max: String(150 * 5),
      },
      "ellipsis-0x21dE718BCB36F649E1A7a7874692b530Aa6f986d":
        scrappedApy["ellipsis-0x21dE718BCB36F649E1A7a7874692b530Aa6f986d"],
      "dot-0x21dE718BCB36F649E1A7a7874692b530Aa6f986d":
        scrappedApy["dot-0x21dE718BCB36F649E1A7a7874692b530Aa6f986d"],
      "stability-eth": scrappedApy["stability-eth"],
      "arth-eth-strategy": scrappedApy["arth-eth-strategy"],
      "arth-mahalend": scrappedApy["arth-mahalend"],
    })
  );
};

cron.schedule("0 0 0 * * *", fetchAndCache); // every minute
fetchAndCache();

export default async (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200);

  // 1 min cache
  if (cache.get("guageV3-apr")) {
    //res.send(cache.get("loans-apr"), cache.get("loan-qlp-tvl"));
    res.send(cache.get("guageV3-apr"));
  } else {
    await fetchAndCache();
    //res.send(cache.get("loans-apr"), cache.get("loan-qlp-tvl"));
    res.send(cache.get("guageV3-apr"));
  }
};
