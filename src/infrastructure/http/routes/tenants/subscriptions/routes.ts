import express from 'express';
import * as controller from 'components/tenants/subscriptions/controller';
import {createRules} from './validation';
import {validate} from 'infrastructure/http/middlewares';

const router = express.Router();

router.post('/', createRules, validate, controller.create);
router.get('/', controller.retrieve);
router.delete('/:subscriptionId', controller.del);

export {router as routes};
