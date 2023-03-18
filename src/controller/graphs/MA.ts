import { ethHistoricPrice } from "../..//utils/coingecko";

function simpleMovingAverage(prices, window) {
  if (!prices || prices.length < window) {
    return [];
  }

  let index = window - 1;
  const length = prices.length + 1;
  const simpleMovingAverages = [];

  while (++index < length) {
    const windowSlice = prices.slice(index - window, index);

    let sum = 0;
    windowSlice.forEach((a) => (sum += a[1]));

    //console.log('sum', sum);
    simpleMovingAverages.push([
      windowSlice[windowSlice.length - 1][0],
      sum / window,
    ]);
  }

  return simpleMovingAverages;
}

// simpleMovingAverage(prices, 5)
const fetchAndCache = async () => {
  const ethPrice = await ethHistoricPrice(60);
  const sevenDayMA = await simpleMovingAverage(ethPrice, 7);

  const ethPrice30 = await ethHistoricPrice(85);
  const thirtyDayMA = await simpleMovingAverage(ethPrice30, 30);

  return {
    sevenDayMA: sevenDayMA,
    thirtyDayMA: thirtyDayMA,
  };
};

export default async (_req, res) => {
  res.json(await fetchAndCache());
};
