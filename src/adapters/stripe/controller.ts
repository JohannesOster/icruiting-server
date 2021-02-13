import {catchAsync} from 'adapters/errorHandling';
import payment from 'infrastructure/payment';

export const StripeAdapter = () => {
  const getPrices = catchAsync(async (req, res) => {
    const resp = payment.subscriptions.list();
    res.status(201).json(resp);
  });

  return {getPrices};
};
