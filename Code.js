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
 * Web App 入口
 */
function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : "";

  if (action === "checkUserName") {
    const userName = e.parameter.userName || "";

    return ContentService.createTextOutput(
      JSON.stringify(checkUserName(userName)),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  return HtmlService.createTemplateFromFile("Notification")
    .evaluate()
    .setTitle("Badminton Notification V2")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
