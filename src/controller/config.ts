export const ETH_ARTH = "0x8CC0F052fff7eaD7f2EdCCcaC895502E884a8a71";
export const ETH_MAHA = "0x745407c86df8db893011912d3ab28e68b62e49b0";
export const ETH_USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

export interface IAPRPoolResponse {
  [pool: string]: IAPRResponse;
}

export interface IAPRResponse {
  tvlUSD?: number;
  current: {
    min: number;
    max: number;
    boostEffectiveness: number;
  };
  upcoming: {
    min: number;
    max: number;
    boostEffectiveness: number;
  };
}
