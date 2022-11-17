import { AlphaRouter } from '@uniswap/smart-order-router'
import { Token, CurrencyAmount } from '@uniswap/sdk-core'
import { JSBI, Percent } from "@uniswap/sdk";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

import * as helpers from "@nomicfoundation/hardhat-network-helpers";

const V3_SWAP_ROUTER_ADDRESS = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
const TokenInput = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const TokenOutput = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const ARTHToken = "0x8CC0F052fff7eaD7f2EdCCcaC895502E884a8a71"

const web3Provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/Qo3VJL4WAsOHJQS-BSkdMeYoJAKzL_IS");

const ERC20 = require("./IERC20.json")
const WETHAbi = require("./weth.json");

async function log(inpt){
    console.log(inpt);
    console.log("");
}

const address = "0x0d2026b3EE6eC71FC6746ADb6311F6d3Ba1C000B";
async function Account(){  
    await helpers.impersonateAccount(address);
    const impersonatedSigner = await ethers.getSigner(address);

    await network.provider.send("hardhat_setBalance", [
        address,
        "0x100000000000000000",
    ]);

    return impersonatedSigner
}

const main = async () => {
    let wallet = await Account()

    const usdcContract = await ethers.getContractAt(
        ERC20,
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    )

    const arthContract = await ethers.getContractAt(
        ERC20,
        ARTHToken
    )

    const wethContract = await ethers.getContractAt(
        WETHAbi,
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    )
    
    async function Deposit(amt){
        await wethContract.connect(wallet).deposit({ value: ethers.utils.parseEther('10') })
        let wethBalanceAfterDeposit = await wethContract.balanceOf(address)
        console.log("wethBalance after deposit", Number(wethBalanceAfterDeposit));
    }
    
    async function Approve(Toked, amt){
        await wethContract.connect(wallet).approve(V3_SWAP_ROUTER_ADDRESS, amt)
    }
    
    const router:any = new AlphaRouter({ chainId: 1, provider: web3Provider });
    const WETH = new Token(
      router.chainId,
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      18,
      'WETH',
      'Wrapped Ether'
    );
    
    const USDC = new Token(
      router.chainId,
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      6,
      'USDC',
      'USD//C'
    );

    const ARTH = new Token(
        router.chainId,
        '0x8CC0F052fff7eaD7f2EdCCcaC895502E884a8a71',
        18,
        'ARTH',
        'ARTH Stablecoin'
    );
    
    const typedValueParsed = '1000000000000000000';
    const wethAmount = CurrencyAmount.fromRawAmount(WETH, JSBI.BigInt(typedValueParsed));
    
    const IO = "Exact_Input"
    const TradeType = IO == "Exact_Input" ? 0 : 1;
    
    const route = await router.route(
      wethAmount,
      ARTH,
      TradeType,
      {
        recipient: address,
        slippageTolerance: new Percent(JSBI.BigInt(5), JSBI.BigInt(100)),
        deadline: Math.floor(Date.now()/1000 +1800)
      }
    );
    
    var wethBalanceBefore = await wethContract.balanceOf(address);
    log("WETH Balance Initial : "+wethBalanceBefore.toString());
    
    await Deposit("1000000000000000000");
    await Approve(TokenInput,"1000000000000000000");
    
    var wethBalanceLater = await wethContract.balanceOf(address);
    log("WETH Balance Later: "+wethBalanceLater.toString());

    var usdcBalanceBefore = await usdcContract.balanceOf(address);
    log("USDC Balance : "+usdcBalanceBefore.toString());

    var arthBalanceBefore = await arthContract.balanceOf(address);
    log("ARTH Balance : "+arthBalanceBefore.toString());

    log(`Quote Exact In: ${route.quote.toFixed(wethAmount.currency === WETH ? ARTH.decimals : WETH.decimals)}`);
    log(`Gas Adjusted Quote In: ${route.quoteGasAdjusted.toFixed(wethAmount.currency === WETH ? ARTH.decimals : WETH.decimals)}`);
    
    var nc = await wallet.getTransactionCount();
    
    const transaction = {
      data: route.methodParameters.calldata,
      nonce: nc,
      to: V3_SWAP_ROUTER_ADDRESS,
      value: BigNumber.from(0),
      from: wallet.address,
      gasPrice: BigNumber.from(route.gasPriceWei),
      gasLimit: BigNumber.from(route.estimatedGasUsed).add(BigNumber.from("50000")),
    };
    
    const txHash =  await wallet.sendTransaction(transaction)
    log(txHash.hash);
    
    var tbal = await usdcContract.balanceOf(address);
    log("USDC Balance POST : "+tbal.toString());

    var arthBalancePOST = await arthContract.balanceOf(address);
    log("ARTH Balance POST : "+arthBalancePOST.toString());
    
    var tbalW = await wethContract.balanceOf(address);
    log("WETH Balance POST : "+tbalW.toString());
}

main()
