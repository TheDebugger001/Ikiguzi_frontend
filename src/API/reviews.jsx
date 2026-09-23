import { client } from "./client";

export const reviewsApi = {
  create: (payload) =>
    client.post("/reviews", payload).then((r) => r.data),
  getForProduct: (productId, params) =>
    client.get(`/reviews/product/${productId}`, { params }).then((r) => r.data),
  update: (id, payload) =>
    client.patch(`/reviews/${id}`, payload).then((r) => r.data),
  remove: (id) =>
    client.delete(`/reviews/${id}`).then((r) => r.data),
};
