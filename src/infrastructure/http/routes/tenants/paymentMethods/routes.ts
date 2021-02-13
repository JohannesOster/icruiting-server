import express from 'express';
import * as controller from 'adapters/tenants/paymentMethods/controller';

const router = express.Router();

router.get('/', controller.list);
router.get('/setupIntent', controller.getSetupIntent);
router.post('/default', controller.setDefaultPaymentMethod);
router.delete('/:paymentMethodId', controller.del);

export {router as routes};
