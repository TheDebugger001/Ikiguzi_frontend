import { client } from "./client";

export const notificationsApi = {
  getAll: (params) =>
    client.get("/notifications", { params }).then((r) => r.data),
  markAsRead: (id) =>
    client.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllAsRead: () =>
    client.patch("/notifications/read-all").then((r) => r.data),
  remove: (id) =>
    client.delete(`/notifications/${id}`).then((r) => r.data),
};
