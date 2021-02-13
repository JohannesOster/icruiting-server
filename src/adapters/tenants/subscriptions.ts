import Stripe from 'stripe';
import {catchAsync} from 'adapters/errorHandling';

export const SubscriptionsAdapter = () => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');
  const stripe = new Stripe(stripeKey, {apiVersion: '2020-08-27'});

  const create = catchAsync(async (req, res) => {
    const {stripeCustomerId} = req.user;
    const {priceId} = req.body;

    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId!,
      items: [{price: priceId}],
    });

    res.status(200).json(subscription);
  });

  const retrieve = catchAsync(async (req, res) => {
    const {stripeCustomerId} = req.user;

    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      expand: ['data.plan.product'],
    });

    res.status(200).json(subscriptions.data);
  });

  const del = catchAsync(async (req, res) => {
    const {subscriptionId} = req.params;
    await stripe.subscriptions.del(subscriptionId);
    res.status(200).json({});
  });

  return {create, retrieve, del};
};
