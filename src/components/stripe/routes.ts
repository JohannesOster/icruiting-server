import express from 'express';
import {getPrices} from './controller';

const router = express.Router();

router.get('/prices', getPrices);

export {router as routes};
