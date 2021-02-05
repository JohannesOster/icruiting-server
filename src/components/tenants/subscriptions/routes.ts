import express from 'express';
import * as controller from './controller';
import {createRules} from './validation';
import {validate} from 'middlewares';

const router = express.Router();

router.post('/', createRules, validate, controller.create);
router.get('/', controller.retrieve);
router.delete('/:subscriptionId', controller.del);

export {router as routes};
