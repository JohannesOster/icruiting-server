import {httpReqHandler} from 'infrastructure/http/httpReqHandler';
import paymentService from 'infrastructure/paymentService';

export const SubscriptionsAdapter = () => {
  const list = httpReqHandler(async (req) => {
    const resp = await paymentService.subscriptions.list();
    return {status: 201, body: resp};
  });

  return {list};
};
