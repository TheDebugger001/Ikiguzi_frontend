import { client } from "./client";

export const wholesaleApi = {
  getMine: () =>
    client.get("/wholesale/orders/mine").then((r) => r.data),
  getOrder: (orderId) =>
    client.get(`/wholesale/orders/${orderId}`).then((r) => r.data),
  createOrder: (payload) =>
    client.post("/wholesale/orders", payload).then((r) => r.data),
  payOrder: (orderId, payload) =>
    client.post(`/wholesale/orders/${orderId}/pay`, payload).then((r) => r.data),
  getOtp: (orderId) =>
    client.get(`/wholesale/orders/${orderId}/otp`).then((r) => r.data),
  confirmReceipt: (orderId, payload = {}) =>
    client.post(`/wholesale/orders/${orderId}/confirm-receipt`, payload).then((r) => r.data),
  shipOrder: (orderId, payload = {}) =>
    client.post(`/wholesale/orders/${orderId}/ship`, payload).then((r) => r.data),
  cancelOrder: (orderId, payload = {}) =>
    client.post(`/wholesale/orders/${orderId}/cancel`, payload).then((r) => r.data),
  disputeOrder: (orderId, payload = {}) =>
    client.post(`/wholesale/orders/${orderId}/dispute`, payload).then((r) => r.data),
  refundOrder: (orderId, payload = {}) =>
    client.post(`/wholesale/orders/${orderId}/refund`, payload).then((r) => r.data),
};