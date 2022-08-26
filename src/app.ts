import express from "express";
import logger from "morgan";

import routes from "./routes";
import { open } from "./database/index"

const app = express();
const cors = require("cors");
const bodyParser = require('body-parser')

app.disable("x-powered-by");

app.use(bodyParser.json({ limit: '100mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }))

app.use(cors());
app.use(logger("dev", { skip: () => app.get("env") === "test" }));
app.use(routes);

open()

export default app;
