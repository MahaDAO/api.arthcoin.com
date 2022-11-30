const dotenv = require('dotenv')
dotenv.config()

import { ethers, network } from "hardhat";
import {
    getCollateralPrices,
    CollateralKeys,
    ICollateralPrices,
} from "../../src/controller/coingecko";
import { BigNumber } from "ethers";

import * as helpers from "@nomicfoundation/hardhat-network-helpers";

const ARTHToken = "0xE52509181FEb30EB4979E29EC70D50FD5C44D590"

const web3Provider = new ethers.providers.JsonRpcProvider("https://polygon-mainnet.g.alchemy.com/v2/5WS9LJWgzKu_ug2MalW2Pu9WLBViz-kZ");

const ERC20 = require("./abi/IERC20.json")
const WETHAbi = require("./abi/MaticWeth.json")
//const ARTHABI = require("./abi/arth.json")
const BorrowerOperations = require("./abi/BorrowerOperations.json")
const Mahalend = require("./abi/Mahalend.json")


const e18 = BigNumber.from(10).pow(18)
const amount = 10000000000000000

const Account = async (address) => {  
    await helpers.impersonateAccount(address);
    const impersonatedSigner = await ethers.getSigner(address);

    await network.provider.send("hardhat_setBalance", [
        address,
        "0x100000000000000000",
    ]);

    return impersonatedSigner
}

const fundWETH = async (wethContract, wallet, amt) => {
    async function Deposit(){
        await wethContract.connect(wallet).deposit(
            "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
            "0x",
            { value: ethers.utils.parseEther('10') }
        )
        let wethBalanceAfterDeposit = await wethContract.balanceOf("0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199")
        console.log("wethBalance after deposit", Number(wethBalanceAfterDeposit) / 1e18);
    }
    
    async function Approve(){
        await wethContract.connect(wallet).approve("0x9CAA01991e20e8813DC701C963183e9C21efe3f4", amt)
    }

    Deposit()
    //Approve()
}

const deposit = async (mahalend) => {
    const wallet = "0xA5ABc4Ed0107979771c7e7Cc6e20Fb56dc8E6029";
    const address = await Account(wallet)

    console.log("Depsoiting token with amount :-", amount);
    
    //fundWETH(wethContract, address, "10000000000000000000")
    const depositing = await mahalend.connect(address).deposit(
        "0xE52509181FEb30EB4979E29EC70D50FD5C44D590",
        String(amount),
        "0xA5ABc4Ed0107979771c7e7Cc6e20Fb56dc8E6029",
        2
    )

    console.log("Done Depositing :-", depositing.hash);
}

const borrow = async (mahalend) => {
    const wallet = "0xA5ABc4Ed0107979771c7e7Cc6e20Fb56dc8E6029";
    const address = await Account(wallet)

    console.log("Borrowing token with 10% less amount then to the deposited amount", amount * 0.1);
    //fundWETH(wethContract, address, "10000000000000000000")
    const borrow = await mahalend.connect(address).borrow(
        "0xE52509181FEb30EB4979E29EC70D50FD5C44D590",
        String(amount * 0.1),
        2,
        2,
        "0xA5ABc4Ed0107979771c7e7Cc6e20Fb56dc8E6029"
    )

    console.log("Done Borrowing :-", borrow.hash);
}

const main = async () => {
    const wallet = "0xA5ABc4Ed0107979771c7e7Cc6e20Fb56dc8E6029";
    const address = await Account(wallet)

    const arthContract = await ethers.getContractAt(
        ERC20,
        '0xE52509181FEb30EB4979E29EC70D50FD5C44D590'
    )

    const mahalendContract = await ethers.getContractAt(
        Mahalend,
        '0x9CAA01991e20e8813DC701C963183e9C21efe3f4'
    )

    const wethContract = await ethers.getContractAt(
        WETHAbi,
        '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'
    )

    console.log("Funding ARTH")
    //await fundArth(arthContract)
    await arthContract.connect(address).approve("0x9CAA01991e20e8813DC701C963183e9C21efe3f4", "1000000000000000000")
    
    await deposit(mahalendContract)
    await borrow(mahalendContract)
}

main()