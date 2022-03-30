import CoinGecko from "coingecko-api";

const CoinGeckoClient = new CoinGecko();

export type CollateralKeys =
  | "USDC"
  | "WBTC"
  | "BUSD"
  | "USDT"
  | "ARTH.usd"
  | "bsc.3eps"
  | "polygon.3pool"
  | "DAI"
  | "WETH"
  | "MAHA"
  | "ARTH"
  | "SCLP";

export type ICollateralPrices = {
  [key in CollateralKeys]: number;
};

export const getCollateralPrices = async (): Promise<ICollateralPrices> => {
  const result = await CoinGeckoClient.simple.price({
    ids: "bitcoin,ethereum,dai,tether,mahadao,arth,usd-coin,scallop,binance-usd",
    vs_currencies: "USD",
  });

  return {
    ARTH: result.data.arth.usd,
    WBTC: result.data.bitcoin.usd,
    BUSD: result.data["binance-usd"].usd,
    USDT: result.data.tether.usd,
    "polygon.3pool": 1.048,
    "ARTH.usd": 1,
    "bsc.3eps": 1.0392,
    DAI: result.data.dai.usd,
    USDC: result.data["usd-coin"].usd,
    WETH: result.data.ethereum.usd,
    MAHA: result.data.mahadao.usd,
    SCLP: result.data.scallop.usd,
  };
};