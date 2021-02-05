import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import {notFound, errorHandler} from './middlewares';
import {routes} from './routes';

const app = express();

app.use(
  bodyParser.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf; // pass raw body for stripe webhook endpoint
    },
  }),
);
app.use(cors());

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

app.use('/', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
