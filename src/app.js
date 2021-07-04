import express from 'express';
import path from 'path';
import logger from 'morgan';
import bodyParser from 'body-parser';
import routes from './routes';
import apicache from 'apicache'

import { cronJob } from './controller/cron'

const app = express();
const cors = require('cors')
const cache = apicache.middleware
app.disable('x-powered-by');

// View engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');

app.use(cors())
app.use(logger('dev', {
  skip: () => app.get('env') === 'test'
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.use(cache('60 minutes'))
app.use('/', routes);

cronJob()

// // Catch 404 and forward to error handler
// app.use((req, res, next) => {
//   const err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

// // Error handler
// app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
//   res
//     .status(err.status || 500)
//     .render('error', {
//       message: err.message
//     });
// });

export default app;
