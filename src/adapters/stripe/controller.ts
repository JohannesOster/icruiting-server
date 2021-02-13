import Stripe from 'stripe';
import {catchAsync} from 'adapters/errorHandling';
import webhookHandler from './webhookHandler';
import config from 'config';

export const StripeAdapter = () => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');
  const stripe = new Stripe(stripeKey, {apiVersion: '2020-08-27'});

  const getPrices = catchAsync(async (req, res) => {
    const {data} = await stripe.prices.list({
      limit: 3,
      expand: ['data.product'],
    });
    const filterd = data.filter((price) => {
      const isFriendsAndFamiliy =
        (price.product as any).id === config.freeStripeProducId;
      const isActive = price.active;
      return isActive && !isFriendsAndFamiliy;
    });

    res.status(201).json(filterd);
  });

  const webhook = catchAsync(async (req, res) => {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody,
        req.header('Stripe-Signature') || '',
        process.env.STRIPE_WEBHOOK_SECRET || '',
      );
    } catch (err) {
      console.error(err);
      console.error(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }

    res.json({received: true});

    try {
      const handler = webhookHandler[event.type];
      if (handler) handler(event.data.object);
    } catch (error) {
      console.error(error);
    }
  });

  return {getPrices, webhook};
};
