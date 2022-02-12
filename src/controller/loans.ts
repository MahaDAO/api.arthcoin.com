import { polygonProvider, bscProvider } from "../web3";
import { getCollateralPrices, ICollatearlPrices } from "./coingecko";
import { ethers } from "ethers";

// ABIs
const BasicStakingABI = require("../abi/BasicStaking.json");
const UniswapV2PairABI = require("../abi/UniswapV2Pair.json");
const IERC20ABI = require("../abi/IERC20.json");

const stakingAddressesBsc = {
  arthBusd: "0xE8b16cab47505708a093085926560a3eB32584B8",
  arthMaha: "0x7699d230Ba47796fc2E13fba1D2D52Ecb0318c33",
  busd: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
  arth: "0xb69a424df8c737a122d0e60695382b3eec07ff4b",
  maha: "0xCE86F7fcD3B40791F63B86C3ea3B8B355Ce2685b",
};

const stakingAddressesPolygon = {
  arthUsdc: "0xD585bfCF37db3C2507e2D44562F0Dbe2E4ec37Bc",
  arthMaha: "0xC82c95666bE4E89AED8AE10bab4b714cae6655d5",
  usdc: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
  arth: "0xe52509181feb30eb4979e29ec70d50fd5c44d590",
  maha: "0xedd6ca8a4202d4a36611e2fff109648c4863ae19",
};

const mahaPolygon = new ethers.Contract(
  stakingAddressesPolygon.maha,
  IERC20ABI,
  polygonProvider
);
const usdcPolygon = new ethers.Contract(
  stakingAddressesPolygon.usdc,
  IERC20ABI,
  polygonProvider
);
const arthPolygon = new ethers.Contract(
  stakingAddressesPolygon.arth,
  IERC20ABI,
  polygonProvider
);
const busdBsc = new ethers.Contract(
  stakingAddressesBsc.busd,
  IERC20ABI,
  bscProvider
);
const mahaBsc = new ethers.Contract(
  stakingAddressesBsc.maha,
  IERC20ABI,
  bscProvider
);
const arthBsc = new ethers.Contract(
  stakingAddressesBsc.arth,
  IERC20ABI,
  bscProvider
);

const tokenDecimals = {
  USDC: 6,
  ARTH: 18,
  MAHA: 18,
  SCLP: 18,
};

const mahaRewardPerYear = 60000;

const arthBusdLPBsc = new ethers.Contract(
  "0x80342bc6125a102a33909d124a6c26CC5D7b8d56",
  UniswapV2PairABI,
  bscProvider
);

const arthMahaLPBsc = new ethers.Contract(
  "0xb955d5b120ff5b803cdb5a225c11583cd56b7040",
  UniswapV2PairABI,
  bscProvider
);

const arthUsdcLPPolygon = new ethers.Contract(
  "0x34aAfA58894aFf03E137b63275aff64cA3552a3E",
  UniswapV2PairABI,
  polygonProvider
);

const arthMahaLPPolygon = new ethers.Contract(
  "0x95de8efD01dc92ab2372596B3682dA76a79f24c3",
  UniswapV2PairABI,
  polygonProvider
);

const getLPTokenValueArthBusdBsc = async (
  collateralPrices: ICollatearlPrices
) => {
  const poolTokenBusdBalance =
    (await busdBsc.balanceOf("0x80342bc6125a102a33909d124a6c26CC5D7b8d56")) /
    10 ** 18;
  console.log("poolTokenBusdBalance", poolTokenBusdBalance);

  const poolTokenArthBalance =
    (await arthBsc.balanceOf("0x80342bc6125a102a33909d124a6c26CC5D7b8d56")) /
    10 ** 18;
  console.log("poolTokenArthBalance", poolTokenArthBalance);

  const busdPrice = collateralPrices.BUSD;
  const arthPrice = collateralPrices.ARTH;

  console.log("busdPrice", busdPrice, "arthPrice", arthPrice);

  const totalUSDValue =
    poolTokenBusdBalance * busdPrice + poolTokenArthBalance * arthPrice;

  console.log("totalUSDValue", totalUSDValue);

  let totalSupplyLP = (await arthBusdLPBsc.totalSupply()) / 10 ** 18;
  console.log("totalSupplyLP", totalSupplyLP);

  return totalUSDValue / totalSupplyLP;
};

const getLPTokenValueArthMahaBsc = async (
  collateralPrices: ICollatearlPrices
) => {
  const poolTokenMahaBalance =
    (await mahaBsc.balanceOf("0xb955d5b120ff5b803cdb5a225c11583cd56b7040")) /
    10 ** 18;
  const poolTokenArthBalance =
    (await arthBsc.balanceOf("0xb955d5b120ff5b803cdb5a225c11583cd56b7040")) /
    10 ** 18;

  const mahaPrice = collateralPrices.MAHA;
  const arthPrice = collateralPrices.ARTH;

  const totalUSDValue =
    poolTokenMahaBalance * mahaPrice + poolTokenArthBalance * arthPrice;

  let totalSupplyLP = (await arthMahaLPBsc.totalSupply()) / 10 ** 18;

  return totalUSDValue / totalSupplyLP;
};

const getLPTokenValueArthUsdcPolygon = async (
  collateralPrices: ICollatearlPrices
) => {
  const poolTokenUsdcBalance =
    (await usdcPolygon.balanceOf(
      "0x34aAfA58894aFf03E137b63275aff64cA3552a3E"
    )) /
    10 ** 18;
  const poolTokenArthBalance =
    (await arthPolygon.balanceOf(
      "0x34aAfA58894aFf03E137b63275aff64cA3552a3E"
    )) /
    10 ** 18;

  const usdcPrice = collateralPrices.USDC;
  const arthPrice = collateralPrices.ARTH;

  const totalUSDValue =
    poolTokenUsdcBalance * usdcPrice + poolTokenArthBalance * arthPrice;

  let totalSupplyLP = (await arthUsdcLPPolygon.totalSupply()) / 10 ** 18;

  return totalUSDValue / totalSupplyLP;
};

const getLPTokenValueArthMahaPolygon = async (
  collateralPrices: ICollatearlPrices
) => {
  const poolTokenMahaBalance =
    (await mahaPolygon.balanceOf(
      "0x95de8efD01dc92ab2372596B3682dA76a79f24c3"
    )) /
    10 ** 18;
  const poolTokenArthBalance =
    (await arthBsc.balanceOf("0x95de8efD01dc92ab2372596B3682dA76a79f24c3")) /
    10 ** 18;

  const mahaPrice = collateralPrices.MAHA;
  const arthPrice = collateralPrices.ARTH;

  const totalUSDValue =
    poolTokenMahaBalance * mahaPrice + poolTokenArthBalance * arthPrice;

  let totalSupplyLP = (await arthMahaLPPolygon.totalSupply()) / 10 ** 18;

  return totalUSDValue / totalSupplyLP;
};

const getAPRBsc = async (
  contract: string,
  collateralPrices: ICollatearlPrices,
  lpToken
) => {
  const stakingContract = new ethers.Contract(
    contract,
    BasicStakingABI,
    bscProvider
  );

  let totalSupply = Number(await stakingContract.totalSupply()) / 10 ** 18;
  console.log("totalSupply", totalSupply);

  let lpTokenPrice;

  if (lpToken === "arthBusd") {
    lpTokenPrice = await getLPTokenValueArthBusdBsc(collateralPrices);
  } else if (lpToken === "arthMaha") {
    lpTokenPrice = await getLPTokenValueArthMahaBsc(collateralPrices);
  }

  console.log("lpTokenPrice", lpTokenPrice);

  let mahaAPY = Number(
    ((mahaRewardPerYear * collateralPrices.MAHA) / totalSupply) *
      lpTokenPrice *
      100
  );

  return mahaAPY;
};

const getAPRPolygon = async (
  contract: string,
  collateralPrices: ICollatearlPrices,
  lpToken
) => {
  const stakingContract = new ethers.Contract(
    contract,
    BasicStakingABI,
    polygonProvider
  );

  let totalSupply = Number(await stakingContract.totalSupply()) / 10 ** 18;
  console.log("totalSupply", lpToken, totalSupply);

  let lpTokenPrice;

  if (lpToken === "arthUsdc") {
    lpTokenPrice = await getLPTokenValueArthUsdcPolygon(collateralPrices);
  } else if (lpToken === "arthMaha") {
    lpTokenPrice = await getLPTokenValueArthMahaPolygon(collateralPrices);
  }

  console.log("lpTokenPrice", lpTokenPrice);

  let mahaAPY = Number(
    ((mahaRewardPerYear * collateralPrices.MAHA) / totalSupply) *
      lpTokenPrice *
      100
  );

  return mahaAPY;
};

// reward per minute 0.115
const getTVLPolygon = async (contract, collateralPrices, lpToken) => {
  const stakingContract = new ethers.Contract(
    contract,
    BasicStakingABI,
    polygonProvider
  );

  let totalSupply = Number(await stakingContract.totalSupply()) / 10 ** 18;
  console.log("totalSupply tvl", lpToken, totalSupply);

  let lpTokenPrice;
  if (lpToken === "arthUsdc") {
    lpTokenPrice = await getLPTokenValueArthUsdcPolygon(collateralPrices);
  } else if (lpToken === "arthMaha") {
    lpTokenPrice = await getLPTokenValueArthMahaPolygon(collateralPrices);
  }

  return totalSupply * lpTokenPrice;
};

const getTVLBsc = async (contract, collateralPrices, lpToken) => {
  const stakingContract = new ethers.Contract(
    contract,
    BasicStakingABI,
    bscProvider
  );

  let totalSupply = Number(await stakingContract.totalSupply()) / 10 ** 18;
  console.log("totalSupply tvl", lpToken, totalSupply);

  let lpTokenPrice;
  if (lpToken === "arthBusd") {
    lpTokenPrice = await getLPTokenValueArthBusdBsc(collateralPrices);
  } else if (lpToken === "arthMaha") {
    lpTokenPrice = await getLPTokenValueArthMahaBsc(collateralPrices);
  }

  return totalSupply * lpTokenPrice;
};

let cache: any = {};
const job = async () => {
  console.log("here new farm");

  const collateralPrices = await getCollateralPrices();

  try {
    cache = {
      //   mahaxApy: await mahaxBasicQ3(collateralPrices),
      chainSpecificData: {
        137: {
          apr: {
            arthUsdc: await getAPRPolygon(
              stakingAddressesPolygon.arthUsdc,
              collateralPrices,
              "arthUsdc"
            ),
            arthMaha: await getAPRPolygon(
              stakingAddressesPolygon.arthMaha,
              collateralPrices,
              "arthMaha"
            ),
          },
          tvl: {
            arthMaha: await getTVLPolygon(
              stakingAddressesPolygon.arthMaha,
              collateralPrices,
              "arthMaha"
            ),
            arthUsdc: await getTVLPolygon(
              stakingAddressesPolygon.arthUsdc,
              collateralPrices,
              "arthUsdc"
            ),
          },
        },
        56: {
          apr: {
            arthBusd: await getAPRBsc(
              stakingAddressesBsc.arthBusd,
              collateralPrices,
              "arthBusd"
            ),
            arthMaha: await getAPRBsc(
              stakingAddressesBsc.arthMaha,
              collateralPrices,
              "arthMaha"
            ),
          },
          tvl: {
            arthBusd: await getTVLBsc(
              stakingAddressesBsc.arthBusd,
              collateralPrices,
              "arthBusd"
            ),
            arthMaha: await getTVLBsc(
              stakingAddressesBsc.arthMaha,
              collateralPrices,
              "arthMaha"
            ),
          },
        },
      },
      mahaRewardPerMinute: 0.114,
    };

    console.log(cache);
    console.log("done");
  } catch (error) {
    console.log(error, error.message);
  }
};

setInterval(job, 5 * 60 * 1000); // 5min cache
job();

export default async (_req, res) => res.json(cache);
