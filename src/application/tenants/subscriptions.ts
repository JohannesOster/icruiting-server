import {BaseError, httpReqHandler} from 'application/errorHandling';
import paymentService from 'infrastructure/paymentService';

export const SubscriptionsAdapter = () => {
  const create = httpReqHandler(async (req) => {
    const {stripeCustomerId} = req.user;
    const {priceId} = req.body;
    if (!stripeCustomerId)
      throw new BaseError(422, 'Missing Stripe customer id');

    const subscription = await paymentService.subscriptions.create(
      stripeCustomerId,
      priceId,
    );

    return {body: subscription};
  });

  const retrieve = httpReqHandler(async (req) => {
    const {stripeCustomerId} = req.user;
    if (!stripeCustomerId)
      throw new BaseError(422, 'Missing Stripe customer id');

    const subscriptions = await paymentService.subscriptions.listActive(
      stripeCustomerId,
    );

    return {body: subscriptions};
  });

  const del = httpReqHandler(async (req) => {
    const {subscriptionId} = req.params;
    await paymentService.subscriptions.cancel(subscriptionId);
    return {};
  });

  return {create, retrieve, del};
};
