import express from "express";
import logger from "morgan";

import routes from "./routes";
import "./cron";

const app = express();
const cors = require("cors");
app.disable("x-powered-by");

app.use(cors());
app.use(logger("dev", { skip: () => app.get("env") === "test" }));
app.use(routes);

export default app;
