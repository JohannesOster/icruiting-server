import Stripe from 'stripe';
import {catchAsync} from 'errorHandling';
import webhookHandler from './webhookHandler';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2020-08-27',
});

export const getPrices = catchAsync(async (req, res) => {
  const {data} = await stripe.prices.list({limit: 3, expand: ['data.product']});
  res.status(201).json(data);
});

export const webhook = catchAsync(async (req, res) => {
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
