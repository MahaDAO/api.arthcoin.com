import CoinGecko from "coingecko-api";
import cache from "./cache";

const CoinGeckoClient = new CoinGecko();

export type CollateralKeys =
  | "USDC"
  | "WBTC"
  | "BUSD"
  | "USDT"
  | "DAI"
  | "WETH"
  | "MAHA"
  | "ARTH"
  | "SCLP";

export type ICollateralPrices = {
  [key in CollateralKeys]: number;
};

const _getCollateralPrices = async (): Promise<ICollateralPrices> => {
  const result = await CoinGeckoClient.simple.price({
    ids: "bitcoin,ethereum,dai,tether,mahadao,arth,usd-coin,scallop,binance-usd,apeswap-finance,frax,solidly,matic-network",
    vs_currencies: "USD",
  });

  return {
    ARTH: result.data.arth.usd,
    WBTC: result.data.bitcoin.usd,
    BUSD: result.data["binance-usd"].usd,
    USDT: result.data.tether.usd,
    DAI: result.data.dai.usd,
    USDC: result.data["usd-coin"].usd,
    WETH: result.data.ethereum.usd,
    MAHA: result.data.mahadao.usd,
    SCLP: result.data.scallop.usd,
  };
};

export const getCollateralPrices = async (): Promise<ICollateralPrices> => {
  if (cache.get("coingecko")) return cache.get("coingecko");
  const result = await _getCollateralPrices();
  cache.set("coingecko", result, 60 * 5);
  return result;
};
