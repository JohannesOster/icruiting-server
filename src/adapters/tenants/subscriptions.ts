import {BaseError, catchAsync} from 'adapters/errorHandling';
import payment from 'infrastructure/payment';

export const SubscriptionsAdapter = () => {
  const create = catchAsync(async (req, res) => {
    const {stripeCustomerId} = req.user;
    const {priceId} = req.body;
    if (!stripeCustomerId)
      throw new BaseError(422, 'Missing Stripe customer id');

    const subscription = await payment.subscriptions.create(
      stripeCustomerId,
      priceId,
    );

    res.status(200).json(subscription);
  });

  const retrieve = catchAsync(async (req, res) => {
    const {stripeCustomerId} = req.user;
    if (!stripeCustomerId)
      throw new BaseError(422, 'Missing Stripe customer id');

    const subscriptions = await payment.subscriptions.listActive(
      stripeCustomerId,
    );

    res.status(200).json(subscriptions);
  });

  const del = catchAsync(async (req, res) => {
    const {subscriptionId} = req.params;
    await payment.subscriptions.cancel(subscriptionId);
    res.status(200).json({});
  });

  return {create, retrieve, del};
};
