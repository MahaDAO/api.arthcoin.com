export default async (_req, res) => {
  res.send({
    SLP_USDC_USDT: [
      {
        incentiveAPR: "11",
        rewardTokenAddress: "",
        rewardTokenSymbol: "SUSHI",
      },
    ],
  });
};
