import routes from './routes'
import apicache from 'apicache'
import { cronJob } from './controller/cron'

const express = require('express')
let cache = apicache.middleware
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')

app.use(cors())
app.use(bodyParser.json({ limit: '100mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }))
app.use(cache('60 minutes'))
app.use(routes)

cronJob()

app.get('/', function (req, res) {
    res.send('Hello World')
})

app.listen(3000, () => {
    console.log('App running on 3000');
})
