import {catchAsync} from 'errorHandling';
import Stripe from 'stripe';

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
    console.log(err);
    console.log(`⚠️  Webhook signature verification failed.`);
    console.log(`⚠️  Check the env file and enter the correct webhook secret.`);
    return res.sendStatus(400);
  }

  console.log(event);

  res.json({received: true});
});
