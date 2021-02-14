import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import {notFound, errorHandler, monitor} from './middlewares';
import {routes} from './routes';

const app = express();

app.use(monitor);
app.use(bodyParser.json());
app.use(cors());

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

app.use('/', routes);

app.use(notFound);
app.use(errorHandler);

export {app};