import {httpReqHandler} from 'shared/infrastructure/http';
import paymentService from 'shared/infrastructure/services/paymentService';

export const SubscriptionsAdapter = () => {
  const list = httpReqHandler(async (req) => {
    const resp = await paymentService.subscriptions.list();
    return {status: 201, body: resp};
  });

  return {list};
};
