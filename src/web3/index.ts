import * as nconf from 'nconf'
import Provider from "@truffle/hdwallet-provider";
import Web3 from "web3";

export const me = nconf.get('WALLET_ADDR').toLowerCase();

export const provider: any = new Provider(
  nconf.get('WALLET_KEY'),
  nconf.get('WEB3_URL_HTTP')
);

export const web3 = new Web3(provider);


export const gasPrice = Number(nconf.get('GWEI')) * 1000000000;

