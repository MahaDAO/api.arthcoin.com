import { getArthWethLPTokenPrice, getArthMahaLPTokenPrice, getArthxWethLPTokenPrice } from './controller/APY';
import routes from './routes'
import apicache from 'apicache'

const express = require('express')
let cache = apicache.middleware
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')

app.use(cors())
app.use(bodyParser.json({ limit: '100mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }))
app.use(routes)
app.use(cache('3 minutes'))

app.get('/', function (req, res) {
    res.send('Hello World')
})

app.listen(3000, () => {
    console.log('App running on 3000');
})