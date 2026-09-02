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
/**
 * Web App 入口
 *
 * ① 没有 action
 *    → 打开 Notification.html
 *
 * ② action=checkUserName
 *    → 返回姓名检查 JSON
 *
 * ③ action=registerDevice
 *    → 注册设备并返回 JSON
 *
 * ④ action=getDeviceStatus
 *    → 查询设备状态
 */
function doGet(e) {

  const action = e && e.parameter
    ? e.parameter.action
    : '';

  /*
   * ==========================================
   * API：检查姓名
   * ==========================================
   */
  if (action === 'checkUserName') {

    const userName =
      e.parameter.userName || '';

    return createJsonResponse_(
      checkUserName(userName)
    );
  }


  /*
   * ==========================================
   * API：注册设备
   * ==========================================
   */
  if (action === 'registerDevice') {

    const deviceId =
      e.parameter.deviceId || '';

    const userName =
      e.parameter.userName || '';

    const fcmToken =
      e.parameter.fcmToken || '';

    const platform =
      e.parameter.platform || '';

    try {

      const result =
        registerDevice({
          deviceId: deviceId,
          userName: userName,
          fcmToken: fcmToken,
          platform: platform
        });

      return createJsonResponse_(result);

    } catch (error) {

      return createJsonResponse_({
        success: false,
        message: error.message
      });
    }
  }


  /*
   * ==========================================
   * API：查询设备
   * ==========================================
   */
  if (action === 'getDeviceStatus') {

    const deviceId =
      e.parameter.deviceId || '';

    try {

      const result =
        getDeviceStatus(deviceId);

      return createJsonResponse_(result);

    } catch (error) {

      return createJsonResponse_({
        success: false,
        message: error.message
      });
    }
  }


  /*
   * ==========================================
   * 普通访问
   *
   * 继续打开原来的 GAS 页面
   * ==========================================
   */
  return HtmlService
    .createTemplateFromFile("Notification")
    .evaluate()
    .setTitle("Badminton Notification V2")
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );
}


/**
 * JSON Response
 */
function createJsonResponse_(data) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
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
      message: error.message
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
      message: error.message
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
      message: error.message
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
      message: error.message
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
      message: error.message
    };
  }
}

function testDevicesSheet() {

  const sheet = getDevicesSheet_();

  Logger.log('Sheet name: ' + sheet.getName());
  Logger.log('Last row: ' + sheet.getLastRow());
  Logger.log('Last column: ' + sheet.getLastColumn());

}
