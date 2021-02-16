import express from 'express';
import {SubscriptionsAdapter} from 'application/tenants/subscriptions';
import {createRules} from './validation';
import {validate} from 'infrastructure/http/middlewares';

const adapter = SubscriptionsAdapter();
const router = express.Router();

router.post('/', createRules, validate, adapter.create);
router.get('/', adapter.retrieve);
router.delete('/:subscriptionId', adapter.del);

export {router as routes};
