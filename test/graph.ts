const request = require('request-promise')

let url:string = "https://thegraph.com/hosted-service/subgraph/ianlapham/uniswap-v3-subgraph"

let query = `
{
    factory(id: "0x1F98431c8aD98523631AE4a59f267346ea31F984" ) {
      poolCount
      txCount
      totalVolumeUSD
      totalVolumeETH
    }
}
`

const main = async () => {
    let data = request.post(url)
    console.log(data);
}

main()