import { client } from "./client";

export const paymentsApi = {
  initiateMoMo: (payload) =>
    client.post("/payments/momo/initiate", payload).then((r) => r.data),
  initiateKpayCard: (payload) =>
    client.post("/payments/kpay/card/initiate", payload).then((r) => r.data),
  initiateKpayMomo: (payload) =>
    client.post("/payments/kpay/momo/initiate", payload).then((r) => r.data),
};
