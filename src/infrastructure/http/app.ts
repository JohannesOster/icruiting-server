import express from 'express';
import cors from 'cors';
import {routes} from './routes';
import {notFound, errorHandler} from './middlewares';

const app = express();

app.use(express.json());
app.use(cors());

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

app.use('/', routes);

app.use(notFound);
app.use(errorHandler);

export {app};
