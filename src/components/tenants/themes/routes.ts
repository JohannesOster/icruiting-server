import express from 'express';
import * as controller from './controller';

const router = express.Router();

router.post('/', controller.create);
router.delete('/', controller.del);

export {router as routes};
