import { client } from "./client";

export const notificationsApi = {
  getAll: (params) =>
    client.get("/notifications/mine", { params }).then((r) => {
      const payload = r.data || {};
      const notifications = Array.isArray(payload) ? payload : payload.data;
      const meta = Array.isArray(payload) ? r.meta : payload.meta;
      return {
      notifications: (Array.isArray(notifications) ? notifications : []).map(notification => ({
        ...notification,
        body: notification.body || notification.message || "",
      })),
      unreadCount: meta?.unreadCount || 0,
    }; }),
  markAsRead: (id) =>
    client.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllAsRead: () =>
    client.post("/notifications/read-all").then((r) => r.data),
  remove: (id) =>
    client.delete(`/notifications/${id}`).then((r) => r.data),
};
