import express from 'express';
import {SubscriptionsAdapter} from 'application/subscriptions/controller';

const adapter = SubscriptionsAdapter();
const router = express.Router();

router.get('/', adapter.getSubscriptions);

export {router as routes};
