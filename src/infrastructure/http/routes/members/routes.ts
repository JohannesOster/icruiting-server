import express from 'express';
import {MembersAdapter} from 'application/members/controller';
import {retrieveRules, updateRules} from './validation';
import {validate} from 'infrastructure/http/middlewares/common';
import {requireAdmin, requireAuth} from 'infrastructure/http/middlewares';
import {requireSubscription} from 'infrastructure/http/middlewares/stripe';

const adapter = MembersAdapter();
const router = express.Router();

router.use(requireAuth);
router.use(requireSubscription);
router.use(requireAdmin);
router.post('/', retrieveRules, validate, adapter.create);
router.get('/', adapter.list);
router.put('/:username', updateRules, validate, adapter.update);
router.delete('/:username', adapter.del);

export {router as routes};
