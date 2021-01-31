import Stripe from 'stripe';
import {BaseError, catchAsync} from 'errorHandling';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2020-08-27',
});

export const getSetupIntent = catchAsync(async (req, res) => {
  const {stripeCustomerId} = req.user;

  const setupIntent = await stripe.setupIntents.create({
    payment_method_types: ['sepa_debit'],
    customer: stripeCustomerId,
  });

  res.status(200).json(setupIntent.client_secret);
});

export const list = catchAsync(async (req, res) => {
  const {stripeCustomerId} = req.user;

  const customer = (await stripe.customers.retrieve(stripeCustomerId!)) as any;
  if (!customer) throw new BaseError(404, 'Stripe customer Not Found');

  const {data} = await stripe.paymentMethods.list({
    customer: stripeCustomerId!,
    type: 'sepa_debit',
  });

  if (!data) throw new BaseError(404, 'Payment Methods Not Found');

  const paymentMethods = data.map((paymentMethod) => {
    if (paymentMethod.id !== customer.invoice_settings.default_payment_method)
      return paymentMethod;
    return {is_default: true, ...paymentMethod};
  });

  res.status(200).json(paymentMethods);
});

export const del = catchAsync(async (req, res) => {
  const {stripeCustomerId} = req.user;
  const {paymentMethodId} = req.params;

  const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);

  const {data} = await stripe.paymentMethods.list({
    customer: stripeCustomerId!,
    type: 'sepa_debit',
  });

  if (data.length) {
    const customer: any = await stripe.customers.retrieve(stripeCustomerId!);

    if (!customer.invoice_settings.default_payment_method) {
      await stripe.customers.update(stripeCustomerId!, {
        invoice_settings: {default_payment_method: data[0].id},
      });
    }
  }

  res.status(201).json(paymentMethod);
});

export const setDefaultPaymentMethod = catchAsync(async (req, res) => {
  const {stripeCustomerId} = req.user;
  const {paymentMethodId} = req.body;

  const resp = await stripe.customers.update(stripeCustomerId!, {
    invoice_settings: {default_payment_method: paymentMethodId},
  });

  res.status(200).json(resp);
});
