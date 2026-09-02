/*************************************************
 * badminton_notification_v2
 * FCM.gs
 *
 * Firebase Cloud Messaging HTTP v1
 *
 * 重要：
 * Service Account JSON 不写在代码里。
 * 从 Script Properties 读取。
 *************************************************/

const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

const FCM_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * 取得 Firebase Service Account
 */
function getFirebaseServiceAccount_() {
  const properties = PropertiesService.getScriptProperties();

  const json = properties.getProperty("FIREBASE_SERVICE_ACCOUNT_JSON");

  if (!json) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON が設定されていません。");
  }

  try {
    return JSON.parse(json);
  } catch (error) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON の形式が正しくありません。");
  }
}

/**
 * Base64 URL Safe
 */
function base64UrlEncode_(data) {
  return Utilities.base64EncodeWebSafe(data).replace(/=+$/, "");
}

/**
 * Base64 URL Safe - bytes
 */
function base64UrlEncodeBytes_(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, "");
}

/**
 * 取得 OAuth 2.0 Access Token
 */
function getFirebaseAccessToken_() {
  const serviceAccount = getFirebaseServiceAccount_();

  const now = Math.floor(Date.now() / 1000);

  /*
   * JWT Header
   */

  const header = {
    alg: "RS256",

    typ: "JWT",
  };

  /*
   * JWT Claim
   */

  const claim = {
    iss: serviceAccount.client_email,

    scope: FCM_SCOPE,

    aud: FCM_TOKEN_URL,

    iat: now,

    exp: now + 3600,
  };

  const encodedHeader = base64UrlEncode_(JSON.stringify(header));

  const encodedClaim = base64UrlEncode_(JSON.stringify(claim));

  const unsignedToken = encodedHeader + "." + encodedClaim;

  /*
   * RSA SHA256 签名
   */

  const signature = Utilities.computeRsaSha256Signature(
    unsignedToken,
    serviceAccount.private_key,
  );

  const encodedSignature = base64UrlEncodeBytes_(signature);

  const jwt = unsignedToken + "." + encodedSignature;

  /*
   * Google OAuth Token Endpoint
   */

  const response = UrlFetchApp.fetch(FCM_TOKEN_URL, {
    method: "post",

    contentType: "application/x-www-form-urlencoded",

    payload: {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",

      assertion: jwt,
    },

    muteHttpExceptions: true,
  });

  const responseCode = response.getResponseCode();

  const responseText = response.getContentText();

  if (responseCode !== 200) {
    throw new Error(
      "Google OAuth Token 取得失败。HTTP " + responseCode + ": " + responseText,
    );
  }

  const tokenData = JSON.parse(responseText);

  if (!tokenData.access_token) {
    throw new Error("Access Token が取得できませんでした。");
  }

  return tokenData.access_token;
}

/**
 * 发送 FCM
 *
 * 参数：
 *
 * {
 *   token: 'FCM_TOKEN',
 *   title: '测试通知',
 *   body: '这是测试通知'
 * }
 */
function sendFcmMessage(data) {
  data = data || {};

  const token = String(data.token || "").trim();

  const title = String(data.title || "Badminton Notification");

  const body = String(data.body || "");

  if (!token) {
    throw new Error("FCM Token がありません。");
  }

  const serviceAccount = getFirebaseServiceAccount_();

  const accessToken = getFirebaseAccessToken_();

  const projectId = serviceAccount.project_id;

  const url =
    "https://fcm.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/messages:send";

  const payload = {
    message: {
      token: token,

      notification: {
        title: title,

        body: body,
      },
    },
  };

  const response = UrlFetchApp.fetch(url, {
    method: "post",

    contentType: "application/json",

    headers: {
      Authorization: "Bearer " + accessToken,
    },

    payload: JSON.stringify(payload),

    muteHttpExceptions: true,
  });

  const responseCode = response.getResponseCode();

  const responseText = response.getContentText();

  Logger.log("FCM HTTP: " + responseCode);

  Logger.log("FCM response: " + responseText);

  if (responseCode < 200 || responseCode >= 300) {
    throw new Error("FCM 发送失败。HTTP " + responseCode + ": " + responseText);
  }

  return {
    success: true,

    response: JSON.parse(responseText),
  };
}

/**
 * 从 Devices Sheet 取得当前启用设备
 */
function getEnabledDevices_() {
  const sheet = getDevicesSheet_();

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 9).getValues();

  const devices = [];

  values.forEach(function (row) {
    const deviceId = String(row[0] || "").trim();

    const userName = String(row[1] || "").trim();

    const fcmToken = String(row[2] || "").trim();

    const enabled = row[3] === true;

    const platform = String(row[4] || "").trim();

    const status = String(row[8] || "").trim();

    if (enabled && fcmToken) {
      devices.push({
        deviceId: deviceId,

        userName: userName,

        fcmToken: fcmToken,

        platform: platform,

        status: status,
      });
    }
  });

  return devices;
}

/**
 * 给所有启用设备发送测试通知
 */
function sendTestNotification() {
  const devices = getEnabledDevices_();

  if (devices.length === 0) {
    throw new Error("没有找到 enabled = TRUE 且存在 FCM Token 的设备。");
  }

  const results = [];

  devices.forEach(function (device) {
    try {
      const result = sendFcmMessage({
        token: device.fcmToken,

        title: "バドミントン通知テスト",

        body: "FCM テスト通知が正常に届きました。",
      });

      results.push({
        deviceId: device.deviceId,

        userName: device.userName,

        success: true,

        response: result.response,
      });

      /*
       * last_sent_at
       *
       * A列 = device_id
       * ...
       * H列 = last_sent_at
       */

      const found = findDeviceById_(device.deviceId);

      if (found) {
        const sheet = getDevicesSheet_();

        sheet.getRange(found.rowNumber, 8).setValue(new Date());
      }
    } catch (error) {
      results.push({
        deviceId: device.deviceId,

        userName: device.userName,

        success: false,

        error: error.message,
      });
    }
  });

  Logger.log(JSON.stringify(results, null, 2));

  return results;
}

function testFirebaseAccessToken() {
  const token = getFirebaseAccessToken_();

  Logger.log("Access Token obtained successfully.");

  Logger.log("Token length: " + token.length);
}
