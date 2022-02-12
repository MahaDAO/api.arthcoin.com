import CoinGecko from "coingecko-api";

const CoinGeckoClient = new CoinGecko();

export type CollateralKeys =
  | "USDC"
  | "WBTC"
  | "BUSD"
  | "USDT"
  | "WETH"
  | "MAHA"
  | "ARTH"
  | "SCLP";

export type ICollateralPrices = {
  [key in CollateralKeys]: number;
};

export const getCollateralPrices = async (): Promise<ICollateralPrices> => {
  const result = await CoinGeckoClient.simple.price({
    ids: "bitcoin,ethereum,tether,mahadao,arth,usd-coin,scallop,binance-usd",
    vs_currencies: "USD",
  });

  return {
    ARTH: result.data.arth.usd,
    WBTC: result.data.bitcoin.usd,
    BUSD: result.data["binance-usd"].usd,
    USDT: result.data.tether.usd,
    USDC: result.data["usd-coin"].usd,
    WETH: result.data.ethereum.usd,
    MAHA: result.data.mahadao.usd,
    SCLP: result.data.scallop.usd,
  };
};
