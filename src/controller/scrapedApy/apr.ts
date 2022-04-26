const request = require('request-promise')

export const scrappedApr = async () => {
    const rawDataEllipsis = await request('https://api.ellipsis.finance/api/getAPRs')
    const arthDataJson = JSON.parse(rawDataEllipsis)
    const arthData = arthDataJson.data["16"]

    const epxAprWithoutBoost = arthData.aprWithoutBoost
    // console.log(epxAprWithoutBoost);
    
    const rawDataDot = await request('https://api.dotdot.finance/api/lpDetails')
    const dotDataJson = JSON.parse(rawDataDot)
    const dotData = dotDataJson.data.tokens[18]
    const dotApy = dotData.dddAPR + dotData.epxAPR

    return {
        ellipsis: epxAprWithoutBoost,
        dot: dotApy
    }
}