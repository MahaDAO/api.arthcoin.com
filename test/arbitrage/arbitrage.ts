const dotenv = require('dotenv')
dotenv.config()

import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

import {
    getCollateralPrices,
    CollateralKeys,
    ICollateralPrices,
} from "../../src/controller/coingecko";

import { spreadtOpportunity, calculateSpread } from "./protocolPrice"
import * as helpers from "@nomicfoundation/hardhat-network-helpers";

//Uniswap v3 imports
import { Pool } from '@uniswap/v3-sdk'
import { CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { Route } from '@uniswap/v3-sdk'
import { Trade } from '@uniswap/v3-sdk'
import { abi as QuoterABI } from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'

const GMUOracle = require("./abi/GMUOracle.json")
const UniswapV3Pool = require("./abi/uniswapV3Pool.json")
const ARTHABI = require("./abi/IERC20.json")
const WETHABI = require("./abi/weth.json")

const SwapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; 
const poolAddress = '0xE7cDba5e9b0D5E044AaB795cd3D659aAc8dB869B'
const quoterAddress = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'

// Copied Functions ===========================================================================
export function getSlot(userAddress, mappingSlot) {
    return ethers.utils.solidityKeccak256(
        ["uint256", "uint256"],
        [userAddress, mappingSlot]
    )
}

export async function checkSlot(erc20, mappingSlot) {
    const contractAddress = erc20.address
    const userAddress = ethers.constants.AddressZero

    // the slot must be a hex string stripped of leading zeros! no padding!
    // https://ethereum.stackexchange.com/questions/129645/not-able-to-set-storage-slot-on-hardhat-network
    const balanceSlot = getSlot(userAddress, mappingSlot)

    // storage value must be a 32 bytes long padded with leading zeros hex string
    const value:any = 0xDEADBEEF
    const storageValue = ethers.utils.hexlify(ethers.utils.zeroPad(value, 32))

    await ethers.provider.send(
        "hardhat_setStorageAt",
        [
            contractAddress,
            balanceSlot,
            storageValue
        ]
    )
    return await erc20.balanceOf(userAddress) == value
}

export async function findBalanceSlot(erc20) {
    const snapshot = await network.provider.send("evm_snapshot")
    for (let slotNumber = 0; slotNumber < 100; slotNumber++) {
        try {
            if (await checkSlot(erc20, slotNumber)) {
                await ethers.provider.send("evm_revert", [snapshot])
                return slotNumber
            }
        } catch { }
        await ethers.provider.send("evm_revert", [snapshot])
    }
}

// ===========================================================================
  
const main = async () => {
    const collateralPrices = await getCollateralPrices();

    const gmuContract =  await ethers.getContractAt(
        GMUOracle,
        '0x7EE5010Cbd5e499b7d66a7cbA2Ec3BdE5fca8e00'
    )
    
    const arthWethPoolContract = await ethers.getContractAt(
        UniswapV3Pool,
        '0xE7cDba5e9b0D5E044AaB795cd3D659aAc8dB869B'
    )

    const quoterContract = await ethers.getContractAt(
        QuoterABI,
        '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'
    )

    const arthContract = await ethers.getContractAt(
        ARTHABI,
        '0x8CC0F052fff7eaD7f2EdCCcaC895502E884a8a71'
    )
    
    const wethContract = await ethers.getContractAt(
        WETHABI,
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    )

    const address = "0x0d2026b3EE6eC71FC6746ADb6311F6d3Ba1C000B";
    await helpers.impersonateAccount(address);
    const impersonatedSigner = await ethers.getSigner(address);

    const value:any = 123456789
    console.log('value', value);
    
    let arthBalanceInitial = await arthContract.balanceOf(address)
    console.log("arthBalanceInitial", Number(arthBalanceInitial));

    const mappingSlot = await findBalanceSlot(arthContract)
    console.log("Found ARTH.balanceOf slot: ", mappingSlot)

    const signerBalanceSlot = getSlot(address, mappingSlot)
    
    await network.provider.send("hardhat_setBalance", [
        address,
        "0x100000000000000000",
    ]);

    await network.provider.send("hardhat_setStorageAt", [
        arthContract.address,
        signerBalanceSlot,
        ethers.utils.hexlify(ethers.utils.zeroPad(value, 32))
    ]);

    let arthBalance = await arthContract.balanceOf(address)
    console.log("arthBalance", Number(arthBalance));

    let wethBalanceInitial = await wethContract.balanceOf(address)
    console.log("wethBalanceInitial", Number(wethBalanceInitial));

    const mappingSlotWeth = await findBalanceSlot(wethContract)
    console.log("Found WETH.balanceOf slot: ", mappingSlotWeth)

    const signerBalanceSlotWeth = getSlot(address, mappingSlotWeth)
    
    await network.provider.send("hardhat_setStorageAt", [
        wethContract.address,
        signerBalanceSlotWeth,
        ethers.utils.hexlify(ethers.utils.zeroPad(value, 32))
    ]);

    let wethBalance = await wethContract.balanceOf(address)
    console.log("wethBalance", Number(wethBalance));

    // Deposit ether in WETH contract to get some more weth
    await wethContract.connect(impersonatedSigner).deposit({ value: ethers.utils.parseEther('10') })
    let wethBalanceAfterDeposit = await wethContract.balanceOf(address)
    console.log("wethBalance after deposit", Number(wethBalanceAfterDeposit));

    console.log('run');
    let balance = ethers.utils.formatEther((await impersonatedSigner.getBalance()))
    console.log('balance', balance);
    
    let protocolPrice = Number((await gmuContract.fetchLastGoodPrice() / 1e18).toFixed(5))
    let slot0 = await arthWethPoolContract.slot0()
    let arthSlotPrice = Number(slot0.sqrtPriceX96)
    let token0price = (arthSlotPrice ** 2 / 2 ** 192)
    let wethPrice = collateralPrices["WETH"]
    let arthTradingPrice = Number(((token0price) * wethPrice).toFixed(5))
    
    console.log('protocolPrice', protocolPrice)
    console.log('arthTradingPrice', arthTradingPrice);

    // Price manipulation on uniswap v3
   
}

main()