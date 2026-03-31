/* eslint-disable no-restricted-globals */

// Firebase Cloud Messaging Service Worker
// Handles push notifications when the app is in the background

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { notification: { title: "GlowApp", body: event.data.text() } };
  }

  // Support both FCM formats
  const notification = payload.notification || {};
  const data = payload.data || {};

  const title = notification.title || data.title || "GlowApp";
  const body = notification.body || data.body || "";

  // Determine action URL based on notification type
  const type = data.type || "";
  let actionUrl = "/";

  switch (type) {
    case "new_booking":
    case "client_cancellation":
      actionUrl = data.tenant_slug ? `/admin/${data.tenant_slug}` : "/admin";
      break;
    case "new_review":
      actionUrl = data.tenant_slug ? `/${data.tenant_slug}` : "/admin";
      break;
    case "client_messages":
    case "client_message":
      actionUrl = data.conversation_id
        ? `/mensajes?chat=${data.conversation_id}`
        : "/admin?tab=messages";
      break;
    case "booking_confirmed":
    case "booking_cancelled":
    case "reminder_24h":
    case "reminder_2h":
    case "review_request":
      actionUrl = "/mis-citas";
      break;
    case "messages":
    case "message":
      actionUrl = data.conversation_id
        ? `/mensajes?chat=${data.conversation_id}`
        : "/mensajes";
      break;
    default:
      actionUrl = "/";
  }

  const options = {
    body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    vibrate: [100, 50, 100],
    data: { ...data, actionUrl },
    actions: [],
    tag: type || "default",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const actionUrl = event.notification.data?.actionUrl || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            client.navigate(actionUrl);
            return;
          }
        }
        // Open new window
        return self.clients.openWindow(actionUrl);
      })
  );
});
