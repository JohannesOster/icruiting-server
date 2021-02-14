import express from 'express';
import {SubscriptionsAdapter} from 'adapters/Subscriptions/controller';

const adapter = SubscriptionsAdapter();
const router = express.Router();

router.get('/', adapter.getSubscriptions);

export {router as routes};
