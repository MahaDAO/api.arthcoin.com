const request = require('request-promise')

export const scrappedApr = async () => {
    const rawDataEllipsis = await request('https://api.ellipsis.finance/api/getAPRs')
    const arthDataJson = JSON.parse(rawDataEllipsis)
    //console.log('arthDataJson', arthDataJson); 
    const arthData = arthDataJson.data["16"]

    const epxAprWithBoost = arthData.aprWithBoost
    const epxAprWithoutBoost = arthData.aprWithoutBoost

    const epxTvl = arthData.tvl
    //console.log(arthData);
    
    const rawDataDot = await request('https://api.dotdot.finance/api/lpDetails')
    const dotDataJson = JSON.parse(rawDataDot)
    console.log('dotDataJson', dotDataJson, dotDataJson.data);
    
    const dotData = dotDataJson.data.tokens[18]
    const dotDddApr = dotData.realDddAPR
    const dotEpxApr = dotData.realEpxAPR
    const dotApy = dotData.realDddAPR + dotData.realEpxAPR
    const dotTvl = dotData.dddTvlUSD + dotData.epsTvlUSD
    //console.log(dotData, dotTvl);
    
    const dotDataArthu3eps = dotDataJson.data.tokens[18]
    const dotDddAprArthu3eps = dotData.realDddAPR
    const dotEpxAprArthu3eps = dotData.realEpxAPR
    const dotApyArthu3eps = dotData.realDddAPR + dotData.realEpxAPR
    const dotTvlArthu3eps = dotData.dddTvlUSD + dotData.epsTvlUSD

    return {
        ellipsis: epxAprWithBoost,
        ellipsisMinApr: epxAprWithoutBoost,
        ellipsisMaxApr: epxAprWithBoost,

        dotDddApr: dotDddApr,
        dotEpxApr: dotEpxApr,
        dot: dotApy,

        dotDddAprArthu3eps: dotDddAprArthu3eps,
        dotEpxAprArthu3eps: dotEpxAprArthu3eps,
        dotApyArthu3eps: dotApyArthu3eps,

        ellipsisTvl: epxTvl,
        dotTvl: dotTvl,
        dotTvlArthu3eps: dotTvlArthu3eps
    }
}

scrappedApr()