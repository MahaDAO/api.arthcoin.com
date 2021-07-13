
const dotenv = require('dotenv')
const nconf = require('nconf')

dotenv.config();
process.env.ROOT_PATH = __dirname

nconf
  .defaults({
    GWEI: 25,
  })
  .argv()
  .file({ file: "config.json" })
  .env()
  .required(["WALLET_ADDR", "WALLET_KEY", "WEB3_URL_HTTP"]);


if (process.env.NODE_ENV === 'production') {
  require('./dist/index')
  return
}

require('./src/index')
