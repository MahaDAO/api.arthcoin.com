import { me, web3 } from "../web3";

const ABI = require('../web3/deployments/abi/OracleUpdater.json');

export default async () => {
  const instance = new web3.eth.Contract(ABI, '0x8E98466623E5Af52a7c06045eB1ebE074A2d1eD6');
  const getSendParams = async (nonceBump = 0) => {
    return {
      from: me,
      nonce: await web3.eth.getTransactionCount(me) + nonceBump,
      gasPrice: await web3.eth.getGasPrice()
    };
  };

  try {
    console.log('updating oracles');
    const receipt1 = await instance.methods.update().send(await getSendParams());
    console.log('oracles updated; tx hash', receipt1.transactionHash);

  } catch (e) {
    console.log('BondRedemtionOracle tx filed; nvm', e);
  }
}
