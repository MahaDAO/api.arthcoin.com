import express from "express";
import logger from "morgan";

import routes from "./routes";

const app = express();
const cors = require("cors");
const bodyParser = require('body-parser')

app.disable("x-powered-by");

app.use(bodyParser.urlencoded({ extended: false }))

app.use(cors());
app.use(logger("dev", { skip: () => app.get("env") === "test" }));
app.use(routes);

export default app;
