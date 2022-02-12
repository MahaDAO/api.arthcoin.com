import CoinGecko from "coingecko-api";

const CoinGeckoClient = new CoinGecko();

export type ICollatearlPrices = {
  [key in
    | "USDC"
    | "BTC"
    | "BUSD"
    | "USDT"
    | "ETH"
    | "MAHA"
    | "ARTH"
    | "SCLP"]: number;
};

export const getCollateralPrices = async (): Promise<ICollatearlPrices> => {
  const result = await CoinGeckoClient.simple.price({
    ids: "bitcoin,ethereum,tether,mahadao,arth,usd-coin,scallop,binance-usd",
    vs_currencies: "USD",
  });

  return {
    ARTH: result.data.arth.usd,
    BTC: result.data.bitcoin.usd,
    BUSD: result.data["binance-usd"].usd,
    USDT: result.data.tether.usd,
    USDC: result.data["usd-coin"].usd,
    ETH: result.data.ethereum.usd,
    MAHA: result.data.mahadao.usd,
    SCLP: result.data.scallop.usd,
  };
};
