import express from 'express';
import {StripeAdapter} from 'adapters/stripe/controller';

const adapter = StripeAdapter();
const router = express.Router();

router.get('/prices', adapter.getPrices);

export {router as routes};
