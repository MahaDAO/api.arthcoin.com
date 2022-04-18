const dotenv = require('dotenv')
dotenv.config()

import nconf from "nconf";
import { ethers } from "ethers";

export const me = nconf.get("WALLET_ADDR") || process.env.WALLET_KEY;

// export const provider: any = new Provider(
//   nconf.get('WALLET_KEY') || process.env.WALLET_KEY,
//   nconf.get('WEB3_URL_HTTP') || process.env.WEB3_URL_HTTP
// );

export const polygonProvider = new ethers.providers.JsonRpcProvider(
  nconf.get("RPC_URL_POLYGON") || process.env.RPC_URL_POLYGON
);

export const polygonTestnetProvider = new ethers.providers.JsonRpcProvider(
  nconf.get("RPC_URL_MUMBAI") || process.env.RPC_URL_POLYGON_TESTNET
);

export const bscProvider = new ethers.providers.JsonRpcProvider(
  nconf.get("RPC_URL_BSC") || process.env.RPC_URL_BSC
);

export const ethProvider = new ethers.providers.JsonRpcProvider(
  nconf.get("RPC_URL_ETH") || process.env.RPC_URL_ETH
);

export const gasPrice = Number(nconf.get("GWEI")) * 1000000000;
