import express from 'express';
import {PaymentMethodsAdapter} from 'application/tenants/paymentMethods';

const adapter = PaymentMethodsAdapter();
const router = express.Router();

router.get('/', adapter.list);
router.get('/setupIntent', adapter.getSetupIntent);
router.post('/default', adapter.setDefaultPaymentMethod);
router.delete('/:paymentMethodId', adapter.del);

export {router as routes};
