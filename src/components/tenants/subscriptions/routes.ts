import express from 'express';
import * as controller from './controller';

const router = express.Router();

router.post('/', controller.create);
router.get('/', controller.retrieve);
router.delete('/:subscriptionId', controller.del);

export {router as routes};
