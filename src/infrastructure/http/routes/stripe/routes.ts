import express from 'express';
import {StripeAdapter} from 'adapters/stripe/controller';

const adapter = StripeAdapter();
const router = express.Router();

router.get('/prices', adapter.getPrices);
router.post('/webhook', adapter.webhook);

export {router as routes};
