
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
  .required(["RPC_URL_POLYGON", "RPC_URL_BSC", "WALLET_KEY"]);


if (nconf.get('NODE_ENV') === 'production') {
  require('./dist/index')
  return
}

require('./src/index')
