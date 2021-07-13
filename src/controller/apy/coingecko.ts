import CoinGecko from "coingecko-api";

const CoinGeckoClient = new CoinGecko();

export type ICollatearlPrices = {
  [key in "BTC" | "USDT" | "ETH" | "MAHA" | 'ARTHX' | 'ARTH']: number;
};

export const getCollateralPrices = async (): Promise<ICollatearlPrices> => {
  const result = await CoinGeckoClient.simple.price({
    ids: "bitcoin,ethereum,tether,mahadao,arth",
    vs_currencies: "USD",
  });

  return {
    ARTH: result.data.arth.usd,
    ARTHX: 0,
    BTC: result.data.bitcoin.usd,
    USDT: result.data.tether.usd,
    ETH: result.data.ethereum.usd,
    MAHA: result.data.mahadao.usd,
  };
};
