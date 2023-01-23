import Bluebird from "bluebird";
import { protocolETHGraph } from "./protocolEthGraphs";

const request = require("request-promise");

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

export const ethProtocolCPIGraph = async () => {
  const truflationData = await request(
    options("GET", "https://truflation-api.hydrogenx.live/dashboard-data")
  );

  const CPIDataPoints = truflationData.b;
  const cpiDataArray = [];

  await Bluebird.mapSeries(CPIDataPoints, (data) => {
    const date = new Date(data[0]).getTime();
    cpiDataArray.push([date, data[1]]);
  });

  const protocolPrice = await protocolETHGraph(
    "0x7EE5010Cbd5e499b7d66a7cbA2Ec3BdE5fca8e00"
  );

  console.log({
    CPI: cpiDataArray,
    protocolPrice: protocolPrice.protocolPrice,
  });

  return {
    CPI: cpiDataArray,
    protocolPrice: protocolPrice.protocolPrice,
  };
};

export default async (_req, res) => {
  res.json(await ethProtocolCPIGraph());
};
