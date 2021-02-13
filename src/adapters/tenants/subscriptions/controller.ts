import Stripe from 'stripe';
import {catchAsync} from 'infrastructure/http/errors';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2020-08-27',
});

export const create = catchAsync(async (req, res) => {
  const {stripeCustomerId} = req.user;
  const {priceId} = req.body;

  const subscription = await stripe.subscriptions.create({
    customer: stripeCustomerId!,
    items: [{price: priceId}],
  });

  res.status(200).json(subscription);
});

export const retrieve = catchAsync(async (req, res) => {
  const {stripeCustomerId} = req.user;

  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    expand: ['data.plan.product'],
  });

  res.status(200).json(subscriptions.data);
});

export const del = catchAsync(async (req, res) => {
  const {subscriptionId} = req.params;
  await stripe.subscriptions.del(subscriptionId);
  res.status(200).json({});
});
