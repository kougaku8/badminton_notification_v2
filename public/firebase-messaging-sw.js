importScripts(
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js",
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js",
);

const firebaseConfig = {
  apiKey: "AIzaSyD6DUuQto_5BYZJDgkaI8CBGaOQkXMgrCk",
  authDomain: "badminton-notification.firebaseapp.com",
  projectId: "badminton-notification",
  storageBucket: "badminton-notification.firebasestorage.app",
  messagingSenderId: "419794096766",
  appId: "1:419794096766:web:9dd990fe827719d149fe2f",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log("[firebase-messaging-sw.js] Background message:", payload);

  const notificationTitle =
    payload.notification?.title || "Badminton Notification";

  const notificationOptions = {
    body: payload.notification?.body || "",

    icon: "/icon-192.png",

    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
