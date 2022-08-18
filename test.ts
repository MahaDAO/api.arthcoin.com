const Web3 = require('web3');
const web3 = new Web3('http://18.168.204.182:8545');

const main = async () => {
    const createTransaction = await web3.eth.accounts.signTransaction(
        {
          from: "0x5036D3c9c37E78036E6fBA15126fA22562735d35",
          to: "0x775C72FB1C28c46F5E9976FFa08F348298fBCEC0",
          value: web3.utils.toWei('1', 'ether'),
          gas: '21000',
        },
        '1c3d91108fba683026bbfb2333042893f391bec8a0135abb784b738006c40abe'
    );
    
    // Deploy transaction
    const createReceipt = await web3.eth.sendSignedTransaction(
        createTransaction.rawTransaction
    );
    
    console.log(
        `Transaction successful with hash: ${createReceipt.transactionHash}`
    );
}

main()