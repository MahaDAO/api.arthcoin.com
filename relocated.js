const getarthWethLP = async () => {
    let parsedBody = data
    let amount = parsedBody.amount

    const reserves = await arthWethLP.methods.getReserves().call()
    let arthWethLPReserve0 = (reserves._reserve0 / 10 ** 18)
    let arthWethLPReserve1 = (reserves._reserve1 / 10 ** 18)

    let arthPrice = (await getArthPrice()) / 10 ** 6
    let wethGMUPrice = Number((await getEthGmuPrice()) / 10 ** 6)
    let realWethPrice = await getRealWethPrice()

    let arthUsdPrice = arthWethLPReserve0 * arthPrice
    let wethGMUUsdPrice = arthWethLPReserve1 * wethGMUPrice
    let wethUsdPrice = arthWethLPReserve1 * realWethPrice

    // arth/eth 
    let arthEthGMUprice = Number((arthUsdPrice / wethGMUPrice))
    let arthEthprice = Number((arthUsdPrice / realWethPrice))

    let sumOfReserve = (arthWethLPReserve0 + arthWethLPReserve1)
    let totalSupply = await arthWethLP.methods.totalSupply().call()
    let LPUSD = sumOfReserve / totalSupply
    let sevenDaysReward = Number(await arthWethLPStake.methods.getRewardForDuration().call())
    // TLV - summ of the reserves * arth/eth usdt
    // 1 LP token = TLV / total supply

    // console.log(arthWethLPReserve0, arthWethLPReserve1)
    // console.log(arthPrice, arthEthGMUprice, arthEthprice,  wethGMUPrice, realWethPrice);
    // console.log(arthUsdPrice, wethGMUUsdPrice, wethUsdPrice);
    //console.log(sumOfReserve, arthEthGMUprice, arthEthprice, LPUSD, sevenDaysReward);

    let oneDayRewardAmount = (sevenDaysReward / 7) * LPUSD
    let sevenDayRewardAmount = sevenDaysReward * LPUSD
    let halfYearlyRewardAmount = (oneDayRewardAmount * 180) * LPUSD
    //console.log(oneDayRewardAmount, sevenDayRewardAmount, halfYearlyRewardAmount);
    // rewards per token 
    // 6 months pool duration

    let APY = ((halfYearlyRewardAmount * 2) / amount) * 100
    res.send({ "APY": APY })
}

const getArthMahaLPTokenPrice = async (data, res) => {
    let parsedBody = data
    let amount = parsedBody.amount

    const reserves = await arthMahaLP.methods.getReserves().call()
    let arthMahaLPReserve0 = (reserves._reserve0 / 10 ** 18)
    let arthMahaLPReserve1 = (reserves._reserve1 / 10 ** 18)

    let arthPrice = (await getArthPrice()) / 10 ** 6
    let wethGMUPrice = Number((await getMahaPrice()) / 10 ** 6)
    let realWethPrice = await getRealWethPrice()

    let arthUsdPrice = arthMahaLPReserve0 * arthPrice
    let wethGMUUsdPrice = arthMahaLPReserve1 * wethGMUPrice
    let wethUsdPrice = arthMahaLPReserve1 * realWethPrice

    // arth/eth 
    let arthEthGMUprice = Number((arthUsdPrice / wethGMUPrice))
    let arthEthprice = Number((arthUsdPrice / realWethPrice))

    let sumOfReserve = (arthMahaLPReserve0 + arthMahaLPReserve1)
    let totalSupply = await arthMahaLP.methods.totalSupply().call()
    let LPUSD = sumOfReserve / totalSupply
    let sevenDaysReward = Number(await arthMahaStake.methods.getRewardForDuration().call())
    // TLV - summ of the reserves * arth/eth usdt
    // 1 LP token = TLV / total supply

    let oneDayRewardAmount = (sevenDaysReward / 7) * LPUSD
    let sevenDayRewardAmount = sevenDaysReward * LPUSD
    let halfYearlyRewardAmount = (oneDayRewardAmount * 180) * LPUSD

    let APY = ((halfYearlyRewardAmount * 2) / amount) * 100
    //console.log(APY);
    res.send({ "APY": APY })
}

const getArthxWethLPTokenPrice = async (data, res) => {
    let parsedBody = data
    let amount = parsedBody.amount

    const reserves = await arthxWethLP.methods.getReserves().call()
    let arthxWethLPReserve0 = (reserves._reserve0 / 10 ** 18)
    let arthxWethLPReserve1 = (reserves._reserve1 / 10 ** 18)

    let arthPrice = (await getArthPrice()) / 10 ** 6
    //let wethGMUPrice = Number((await getEthGmuPrice()) / 10 ** 6)
    //let realWethPrice = await getRealWethPrice()

    let arthUsdPrice = arthxWethLPReserve0 * arthPrice
    // let wethGMUUsdPrice = arthxWethLPReserve1 * wethGMUPrice
    // let wethUsdPrice = arthxWethLPReserve1 * realWethPrice

    // arth/eth 
    // let arthEthGMUprice = Number((arthUsdPrice / wethGMUPrice))
    // let arthEthprice = Number((arthUsdPrice / realWethPrice))

    let sumOfReserve = (arthxWethLPReserve0 + arthxWethLPReserve1)
    let totalSupply = await arthxWethLP.methods.totalSupply().call()
    // let tvlGmu = Number(sumOfReserve * arthEthGMUprice)
    let LPUSD = sumOfReserve / totalSupply
    let sevenDaysReward = Number(await arthxwethStake.methods.getRewardForDuration().call())
    // TLV - summ of the reserves * arth/eth usdt
    // 1 LP token = TLV / total supply

    let oneDayRewardAmount = (sevenDaysReward / 7) * LPUSD
    let sevenDayRewardAmount = sevenDaysReward * LPUSD
    let halfYearlyRewardAmount = (oneDayRewardAmount * 180) * LPUSD
    //console.log(oneDayRewardAmount, sevenDayRewardAmount, halfYearlyRewardAmount);
    // rewards per token 
    // 6 months pool duration

    let APY = ((halfYearlyRewardAmount * 2) / amount) * 100
    //console.log(APY);
    res.send({ "APY": APY })
}
