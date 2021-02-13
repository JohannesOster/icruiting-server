import {BaseError, catchAsync} from 'adapters/errorHandling';
import payment from 'infrastructure/payment';

export const PaymentMethodsAdapter = () => {
  const getSetupIntent = catchAsync(async (req, res) => {
    const {stripeCustomerId} = req.user;

    if (!stripeCustomerId)
      throw new BaseError(422, 'Missing Stripe customer id');

    const setupIntent = await payment.payment.initialize(stripeCustomerId);

    res.status(200).json(setupIntent.client_secret);
  });

  const list = catchAsync(async (req, res) => {
    const {stripeCustomerId} = req.user;

    if (!stripeCustomerId)
      throw new BaseError(422, 'Missing Stripe customer id');

    const paymentMethods = await payment.paymentMethods.list(stripeCustomerId);
    res.status(200).json(paymentMethods);
  });

  const del = catchAsync(async (req, res) => {
    const {stripeCustomerId} = req.user;
    const {paymentMethodId} = req.params;

    if (!stripeCustomerId)
      throw new BaseError(422, 'Missing Stripe customer id');

    await payment.paymentMethods.del(stripeCustomerId, paymentMethodId);

    res.status(201).json();
  });

  const setDefaultPaymentMethod = catchAsync(async (req, res) => {
    const {stripeCustomerId} = req.user;
    const {paymentMethodId} = req.body;

    if (!stripeCustomerId)
      throw new BaseError(422, 'Missing Stripe customer id');

    await payment.paymentMethods.setDefault(stripeCustomerId, paymentMethodId);

    res.status(200).json();
  });

  return {getSetupIntent, list, del, setDefaultPaymentMethod};
};
