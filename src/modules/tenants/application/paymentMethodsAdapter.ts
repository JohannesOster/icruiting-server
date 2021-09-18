import {BaseError} from 'application';
import {httpReqHandler} from 'shared/infrastructure/http';
import paymentService from 'infrastructure/paymentService';

export const PaymentMethodsAdapter = () => {
  const getSetupIntent = httpReqHandler(async (req) => {
    const {stripeCustomerId} = req.user;

    if (!stripeCustomerId)
      throw new BaseError(422, 'Missing Stripe customer id');

    const setupIntent = await paymentService.payment.initialize(
      stripeCustomerId,
    );

    return {body: setupIntent.client_secret};
  });

  const list = httpReqHandler(async (req) => {
    const {stripeCustomerId} = req.user;

    if (!stripeCustomerId)
      throw new BaseError(422, 'Missing Stripe customer id');

    const paymentMethods = await paymentService.paymentMethods.list(
      stripeCustomerId,
    );

    return {body: paymentMethods};
  });

  const del = httpReqHandler(async (req) => {
    const {stripeCustomerId} = req.user;
    const {paymentMethodId} = req.params;

    if (!stripeCustomerId)
      throw new BaseError(422, 'Missing Stripe customer id');

    await paymentService.paymentMethods.del(stripeCustomerId, paymentMethodId);

    return {status: 201};
  });

  const setDefaultPaymentMethod = httpReqHandler(async (req) => {
    const {stripeCustomerId} = req.user;
    const {paymentMethodId} = req.body;

    if (!stripeCustomerId)
      throw new BaseError(422, 'Missing Stripe customer id');

    await paymentService.paymentMethods.setDefault(
      stripeCustomerId,
      paymentMethodId,
    );

    return {};
  });

  return {getSetupIntent, list, del, setDefaultPaymentMethod};
};
