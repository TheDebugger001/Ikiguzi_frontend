import { client } from "./client";

export const conversationsApi = {
  create: (payload) =>
    client.post("/conversations", payload).then((r) => r.data),
  getAll: () =>
    client.get("/conversations").then((r) => r.data),
  getMessages: (id) =>
    client.get(`/conversations/${id}/messages`).then((r) => r.data),
  sendMessage: (id, payload) =>
    client.post(`/conversations/${id}/messages`, payload).then((r) => r.data),
  markRead: (id) =>
    client.patch(`/conversations/${id}/read`).then((r) => r.data),
  searchContacts: (q) =>
    client.get("/conversations/contacts", { params: { q } }).then((r) => r.data),
};
