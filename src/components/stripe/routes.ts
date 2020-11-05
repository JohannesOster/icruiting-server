import express from 'express';
import {getPrices, webhook} from './controller';

const router = express.Router();

router.get('/prices', getPrices);
router.post('/webhook', webhook);

export {router as routes};
