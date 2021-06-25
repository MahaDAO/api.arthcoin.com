import { getArthWethLPTokenPrice, getArthMahaLPTokenPrice, getArthxWethLPTokenPrice } from './controller/APY';
import routes from './routes'

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')

app.use(cors())
app.use(bodyParser.json({ limit: '100mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }))
app.use(routes)

app.get('/', function (req, res) {
    res.send('Hello World')
})

app.listen(3000, () => {
    console.log('App running on 3000');
})