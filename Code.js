/*************************************************
 * badminton_notification_v2
 * Code.gs
 *
 * Web App 入口
 * 暂时只负责：
 * 1. 打开 Notification.html
 * 2. 提供前端调用 Device.gs 的接口
 *
 * 暂时不接 FCM
 *************************************************/

/**
Web App 入口
*/
function doGet(e) {
  const action =
    e && e.parameter ? String(e.parameter.action || "").trim() : "";

  /*

=========================
Check User Name
=========================
*/

  if (action === "checkUserName") {
    const userName = e.parameter.userName || "";

    return createJsonResponse_(checkUserName(userName));
  }

  /*

=========================
Register Device
=========================
*/

  if (action === "registerDevice") {
    try {
      const data = {
        deviceId: e.parameter.deviceId || "",

        userName: e.parameter.userName || "",

        fcmToken: e.parameter.fcmToken || "",

        platform: e.parameter.platform || "",
      };

      return createJsonResponse_(registerDevice(data));
    } catch (error) {
      return createJsonResponse_({
        success: false,

        message: error && error.message ? error.message : String(error),
      });
    }
  }

  /*

=========================
Get Device Status
=========================
*/

  if (action === "getDeviceStatus") {
    try {
      const deviceId = e.parameter.deviceId || "";

      return createJsonResponse_(getDeviceStatus(deviceId));
    } catch (error) {
      return createJsonResponse_({
        success: false,

        message: error && error.message ? error.message : String(error),
      });
    }
  }

  /*

=========================
Enable Device
=========================
*/

  if (action === "enableDevice") {
    try {
      const deviceId = e.parameter.deviceId || "";

      return createJsonResponse_(enableDevice(deviceId));
    } catch (error) {
      return createJsonResponse_({
        success: false,

        message: error && error.message ? error.message : String(error),
      });
    }
  }

  /*

=========================
Disable Device
=========================
*/

  if (action === "disableDevice") {
    try {
      const deviceId = e.parameter.deviceId || "";

      return createJsonResponse_(disableDevice(deviceId));
    } catch (error) {
      return createJsonResponse_({
        success: false,

        message: error && error.message ? error.message : String(error),
      });
    }
  }

  /*

=========================
Normal Web App Page
=========================
*/

  return HtmlService.createTemplateFromFile("Notification")
    .evaluate()
    .setTitle("Badminton Notification V2")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**

JSON Response
*/
function createJsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/**

API:
Check User Name
*/
function apiCheckUserName(userName) {
  try {
    return checkUserName(userName);
  } catch (error) {
    return {
      success: false,

      message: error.message,
    };
  }
}

/**

API:
Register Device
*/
function apiRegisterDevice(data) {
  try {
    return registerDevice(data);
  } catch (error) {
    return {
      success: false,

      message: error.message,
    };
  }
}

/**

API:
Get Device Status
*/
function apiGetDeviceStatus(deviceId) {
  try {
    return getDeviceStatus(deviceId);
  } catch (error) {
    return {
      success: false,

      message: error.message,
    };
  }
}

/**

API:
Enable Device
*/
function apiEnableDevice(deviceId) {
  try {
    return enableDevice(deviceId);
  } catch (error) {
    return {
      success: false,

      message: error.message,
    };
  }
}

/**

API:
Disable Device
*/
function apiDisableDevice(deviceId) {
  try {
    return disableDevice(deviceId);
  } catch (error) {
    return {
      success: false,

      message: error.message,
    };
  }
}

/**

Test Devices Sheet
*/
function testDevicesSheet() {
  const sheet = getDevicesSheet_();

  Logger.log("Sheet name: " + sheet.getName());

  Logger.log("Last row: " + sheet.getLastRow());

  Logger.log("Last column: " + sheet.getLastColumn());
}

/**
 * JSON Response
 */
function createJsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/**
 * 检查姓名
 *
 * Notification.html
 *       ↓
 * google.script.run
 *       ↓
 * Code.gs
 *       ↓
 * Device.gs
 */
function apiCheckUserName(userName) {
  try {
    return checkUserName(userName);
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * 注册设备
 */
function apiRegisterDevice(data) {
  try {
    return registerDevice(data);
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * 查询设备状态
 */
function apiGetDeviceStatus(deviceId) {
  try {
    return getDeviceStatus(deviceId);
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * 开启设备通知
 */
function apiEnableDevice(deviceId) {
  try {
    return enableDevice(deviceId);
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * 关闭设备通知
 */
function apiDisableDevice(deviceId) {
  try {
    return disableDevice(deviceId);
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

function testDevicesSheet() {
  const sheet = getDevicesSheet_();

  Logger.log("Sheet name: " + sheet.getName());
  Logger.log("Last row: " + sheet.getLastRow());
  Logger.log("Last column: " + sheet.getLastColumn());
}
