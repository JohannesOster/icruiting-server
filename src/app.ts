import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import {notFound, errorHandler} from './middlewares';
import {routes} from './routes';

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use('/', routes);

app.use(cors());
app.use(notFound);
app.use(errorHandler);

export default app;
