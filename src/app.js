import express from 'express';
import path from 'path';
import logger from 'morgan';
import bodyParser from 'body-parser';
import apicache from 'apicache';

import routes from './routes';
import { cronJob } from './controller/cron';

const app = express();
const cors = require('cors');
app.disable('x-powered-by');

// View engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');

app.use(cors())
app.use(logger('dev', { skip: () => app.get('env') === 'test' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.use(apicache.middleware('60 minutes'));
app.use(routes);

cronJob();

export default app;
