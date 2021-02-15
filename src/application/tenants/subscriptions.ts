import {BaseError, httpReqHandler} from 'application/errorHandling';
import payment from 'infrastructure/paymentService';

export const SubscriptionsAdapter = () => {
  const create = httpReqHandler(async (req) => {
    const {stripeCustomerId} = req.user;
    const {priceId} = req.body;
    if (!stripeCustomerId)
      throw new BaseError(422, 'Missing Stripe customer id');

    const subscription = await payment.subscriptions.create(
      stripeCustomerId,
      priceId,
    );

    return {body: subscription};
  });

  const retrieve = httpReqHandler(async (req) => {
    const {stripeCustomerId} = req.user;
    if (!stripeCustomerId)
      throw new BaseError(422, 'Missing Stripe customer id');

    const subscriptions = await payment.subscriptions.listActive(
      stripeCustomerId,
    );

    return {body: subscriptions};
  });

  const del = httpReqHandler(async (req) => {
    const {subscriptionId} = req.params;
    await payment.subscriptions.cancel(subscriptionId);
    return {};
  });

  return {create, retrieve, del};
};
