import Stripe from 'stripe';
import {catchAsync} from 'adapters/errorHandling';
import webhookHandler from './webhookHandler';
import payment from 'infrastructure/payment';

export const StripeAdapter = () => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');
  const stripe = new Stripe(stripeKey, {apiVersion: '2020-08-27'});

  const getPrices = catchAsync(async (req, res) => {
    const resp = payment.subscriptions.list();
    res.status(201).json(resp);
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
