import {catchAsync} from 'errorHandling';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2020-08-27',
});

export const getPrices = catchAsync(async (req, res) => {
  const {data} = await stripe.prices.list({limit: 3, expand: ['data.product']});
  res.status(201).json(data);
});
