import CoinGecko from "coingecko-api";
const CoinGeckoClient = new CoinGecko();
const request = require("request-promise");

const apiKey = process.env.ETHERSCAN_KEY;
const topic =
  "0x4d29de21de555af78a62fc82dd4bc05e9ae5b0660a37f04729527e0f22780cd3";

const ethPrice = async (from) => {
  let priceChart = await CoinGeckoClient.coins.fetchMarketChartRange(
    "ethereum",
    {
      vs_currency: "usd",
      from: from,
      to: Date.now(),
    }
  );

  return priceChart.data.prices;
};

export const protocolETHGraph = async (address) => {
  const url = `https://api.etherscan.io/api?module=logs&action=getLogs&address=${address}&page=1&offset=1000&apikey=${apiKey}&topic0=${topic}`;

  const data = await request.get(url);
  const formatedData = JSON.parse(data);

  //console.log(formatedData.result, formatedData.result.length);
  const dataArray = [];
  const datapoints = await formatedData.result.forEach((val) => {
    dataArray.push([Number(val.timeStamp) * 1000, Number(val.data) / 1e18]);
  });

  //console.log(dataArray[0][0], dataArray[dataArray.length - 1][0], dataArray.length);

  //console.log(dataArray.reverse());
  let price = await ethPrice(dataArray[0][0] / 1000);
  // const ethPriceArray = []
  // const ethDatapoints = await price.forEach((val, i) => {
  //     ethPriceArray.push(
  //         time: Number((val[0])),
  //         price: Number(val[1])
  //     )
  // })

  return {
    protocolPrice: dataArray.reverse(),
    ethPrice: price.reverse(),
  };
};

const fetchAndCache = async () => {
  return await protocolETHGraph("0x7EE5010Cbd5e499b7d66a7cbA2Ec3BdE5fca8e00");
};

export default async (_req, res) => {
  res.json(await fetchAndCache());
};
