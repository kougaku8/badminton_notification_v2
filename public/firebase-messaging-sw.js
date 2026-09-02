/*************************************************

Firebase Cloud Messaging Service Worker
badminton_notification_v2
当前阶段：
初始化 Firebase
接收后台 FCM 消息
暂时不主动发送任何通知
*************************************************/

/*

Firebase Compat SDK
Service Worker 使用 compat 版本，
可以直接通过 importScripts 使用。
*/

importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js",
);

/*************************************************

Firebase Config
↓↓↓ 请替换成你的 Firebase Config ↓↓↓
*************************************************/

firebase.initializeApp({
  apiKey: "AIzaSyD6DUuQto_5BYZJDgkaI8CBGaOQkXMgrCk",

  authDomain: "badminton-notification.firebaseapp.com",

  projectId: "badminton-notification",

  storageBucket: "badminton-notification.firebasestorage.app",

  messagingSenderId: "419794096766",

  appId: "1:419794096766:web:9dd990fe827719d149fe2f",
});

/*************************************************

Firebase Messaging
*************************************************/

const messaging = firebase.messaging();

/*************************************************

Background Message
当前只记录 Log。
后面真正进入通知发送阶段时，
再在这里完善通知显示逻辑。
*************************************************/

messaging.onBackgroundMessage(function (payload) {
  console.log("[firebase-messaging-sw.js] Background message:", payload);
});
