import { AlphaRouter } from '@uniswap/smart-order-router'
import { Token, CurrencyAmount } from '@uniswap/sdk-core'
import { JSBI, Percent } from "@uniswap/sdk";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

import * as helpers from "@nomicfoundation/hardhat-network-helpers";

import {
    getCollateralPrices,
    CollateralKeys,
    ICollateralPrices,
} from "../src/controller/coingecko";

const V3_SWAP_ROUTER_ADDRESS = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
const TokenInput = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const TokenOutput = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const ARTHToken = "0x8CC0F052fff7eaD7f2EdCCcaC895502E884a8a71"

const web3Provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/Qo3VJL4WAsOHJQS-BSkdMeYoJAKzL_IS");

const ERC20 = require("./IERC20.json")
const WETHAbi = require("./weth.json");
const UniswapV3Pool = require("./uniswapV3Pool.json")

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

const tradingPrice = async (contract) => {
    const collateralPrices = await getCollateralPrices();

    let slot0 = await contract.slot0()
    
    let coinSlotPrice = Number(slot0.sqrtPriceX96)
    let token0price = (coinSlotPrice ** 2 / 2 ** 192)
    let wethPrice = collateralPrices["WETH"]
    let coinTradingPrice = Number(((token0price) * wethPrice).toFixed(5))

    //console.log('Trading Price', coinTradingPrice);
    return coinTradingPrice
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

    const arthWethPoolContract = await ethers.getContractAt(
        UniswapV3Pool,
        '0xE7cDba5e9b0D5E044AaB795cd3D659aAc8dB869B'
    )

    const usdcWethPoolContract = await ethers.getContractAt(
        UniswapV3Pool,
        '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640'
    )

    const tradingPriceBefore = await tradingPrice(arthWethPoolContract)
    console.log("trading price before", tradingPriceBefore);
    
    async function Deposit(amt){
        await wethContract.connect(wallet).deposit({ value: ethers.utils.parseEther('10') })
        let wethBalanceAfterDeposit = await wethContract.balanceOf(address)
        console.log("wethBalance after deposit", Number(wethBalanceAfterDeposit) / 1e18);
    }
    
    async function Approve(amt){
        await wethContract.connect(wallet).approve(V3_SWAP_ROUTER_ADDRESS, amt)
    }
    
    const router:any = new AlphaRouter({ chainId: 1, provider: web3Provider });
    const WETH = new Token(
      1,
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      18,
      'WETH',
      'Wrapped Ether'
    );
    
    const USDC = new Token(
      1,
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      6,
      'USDC',
      'USD//C'
    );

    const ARTH = new Token(
        1,
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
        slippageTolerance: new Percent(JSBI.BigInt(10), JSBI.BigInt(100)),
        deadline: Math.floor(Date.now()/1000 +1800),
        v3PoolSelection: "0xE7cDba5e9b0D5E044AaB795cd3D659aAc8dB869B",
      },
    //   {
    //     //v3PoolSelection: "0xE7cDba5e9b0D5E044AaB795cd3D659aAc8dB869B"
        
    //     distributionPercent: 100,
    //     forceCrossProtocol: false,
    //     minSplits: 1,
    //     maxSplits: 10,
    //     maxSwapsPerPath: 10
    //   }
    );
    //console.log("route", route);
    
    var wethBalanceBefore = await wethContract.balanceOf(address);
    console.log("WETH Balance Before : ", wethBalanceBefore / 1e18);
    
    await Deposit("1000000000000000000");
    await Approve("1000000000000000000");
    
    var wethBalanceLater = await wethContract.balanceOf(address);
    console.log("WETH Balance Later : ", wethBalanceLater / 1e18);

    var usdcBalanceBefore = await usdcContract.balanceOf(address);
    console.log("USDC Balance Before : ", usdcBalanceBefore / 1e6);

    var arthBalanceBefore = await arthContract.balanceOf(address);
    console.log("ARTH Balance Before : ", arthBalanceBefore / 1e18);

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
    console.log("transaction hasht", txHash.hash);
    
    var tbal = await usdcContract.balanceOf(address);
    console.log("USDC Balance POST : ", tbal / 1e6);
    
    var arthBalancePOST = await arthContract.balanceOf(address);
    console.log("ARTH Balance POST : ", arthBalancePOST / 1e18);
    
    var tbalW = await wethContract.balanceOf(address);
    console.log("WETH Balance POST : ", tbalW / 1e18);

    const tradingPriceLater = await tradingPrice(arthWethPoolContract)
    console.log("trading price later", tradingPriceLater);    
}

main()
