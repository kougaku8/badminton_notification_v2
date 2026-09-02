/*************************************************
 * badminton_notification_v2
 * Code.gs
 *
 * GAS Web App API
 *
 * 支持：
 * 1. Web App 页面
 * 2. Firebase Hosting → GAS GET API
 * 3. Firebase Hosting → GAS POST API
 * 4. checkUserName
 * 5. registerDevice
 * 6. getDeviceStatus
 * 7. enableDevice
 * 8. disableDevice
 *************************************************/

/*************************************************
 * Web App Entry
 *************************************************/

function doGet(e) {
  const action =
    e && e.parameter ? String(e.parameter.action || "").trim() : "";

  /***********************************************
   * Check User Name
   ***********************************************/

  if (action === "checkUserName") {
    const userName = e.parameter.userName || "";

    return createJsonResponse_(apiCheckUserName(userName));
  }

  /***********************************************
   * Register Device
   ***********************************************/

  if (action === "registerDevice") {
    const data = {
      deviceId: e.parameter.deviceId || "",

      userName: e.parameter.userName || "",

      fcmToken: e.parameter.fcmToken || "",

      platform: e.parameter.platform || "",

      language: e.parameter.language || "ja",
    };

    Logger.log("doGet registerDevice data = " + JSON.stringify(data));

    return createJsonResponse_(apiRegisterDevice(data));
  }

  /***********************************************
   * Get Device Status
   ***********************************************/

  if (action === "getDeviceStatus") {
    const deviceId = e.parameter.deviceId || "";

    return createJsonResponse_(apiGetDeviceStatus(deviceId));
  }

  /***********************************************
   * Enable Device
   ***********************************************/

  if (action === "enableDevice") {
    const deviceId = e.parameter.deviceId || "";

    return createJsonResponse_(apiEnableDevice(deviceId));
  }

  /***********************************************
   * Disable Device
   ***********************************************/

  if (action === "disableDevice") {
    const deviceId = e.parameter.deviceId || "";

    return createJsonResponse_(apiDisableDevice(deviceId));
  }

  /***********************************************
   * Normal Web App Page
   ***********************************************/

  return HtmlService.createTemplateFromFile("Notification")

    .evaluate()

    .setTitle("Badminton Notification V2")

    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/*************************************************
 * POST API
 *
 * Firebase Hosting
 *       ↓
 * fetch()
 *       ↓
 * doPost()
 *************************************************/

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse_({
        success: false,

        message: "POST data がありません。",
      });
    }

    const request = JSON.parse(e.postData.contents);

    const action = String(request.action || "").trim();

    const data = request.data || {};

    Logger.log("doPost action = " + action);

    Logger.log("doPost data = " + JSON.stringify(data));

    /***********************************************
     * Check User Name
     ***********************************************/

    if (action === "checkUserName") {
      return createJsonResponse_(apiCheckUserName(data.userName || ""));
    }

    /***********************************************
     * Register Device
     ***********************************************/

    if (action === "registerDevice") {
      return createJsonResponse_(apiRegisterDevice(data));
    }

    /***********************************************
     * Get Device Status
     ***********************************************/

    if (action === "getDeviceStatus") {
      return createJsonResponse_(apiGetDeviceStatus(data.deviceId || ""));
    }

    /***********************************************
     * Enable Device
     ***********************************************/

    if (action === "enableDevice") {
      return createJsonResponse_(apiEnableDevice(data.deviceId || ""));
    }

    /***********************************************
     * Disable Device
     ***********************************************/

    if (action === "disableDevice") {
      return createJsonResponse_(apiDisableDevice(data.deviceId || ""));
    }

    /***********************************************
     * Unknown Action
     ***********************************************/

    return createJsonResponse_({
      success: false,

      message: "Unknown action: " + action,
    });
  } catch (error) {
    Logger.log(
      "doPost error = " +
        (error && error.message ? error.message : String(error)),
    );

    return createJsonResponse_({
      success: false,

      message: error && error.message ? error.message : String(error),
    });
  }
}

/*************************************************
 * API: Check User Name
 *************************************************/

function apiCheckUserName(userName) {
  try {
    return checkUserName(userName);
  } catch (error) {
    return {
      success: false,

      message: error && error.message ? error.message : String(error),
    };
  }
}

/*************************************************
 * API: Register Device
 *************************************************/

function apiRegisterDevice(data) {
  try {
    Logger.log("apiRegisterDevice data = " + JSON.stringify(data));

    return registerDevice(data);
  } catch (error) {
    return {
      success: false,

      message: error && error.message ? error.message : String(error),
    };
  }
}

/*************************************************
 * API: Get Device Status
 *************************************************/

function apiGetDeviceStatus(deviceId) {
  try {
    return getDeviceStatus(deviceId);
  } catch (error) {
    return {
      success: false,

      message: error && error.message ? error.message : String(error),
    };
  }
}

/*************************************************
 * API: Enable Device
 *************************************************/

function apiEnableDevice(deviceId) {
  try {
    return enableDevice(deviceId);
  } catch (error) {
    return {
      success: false,

      message: error && error.message ? error.message : String(error),
    };
  }
}

/*************************************************
 * API: Disable Device
 *************************************************/

function apiDisableDevice(deviceId) {
  try {
    return disableDevice(deviceId);
  } catch (error) {
    return {
      success: false,

      message: error && error.message ? error.message : String(error),
    };
  }
}

/*************************************************
 * JSON Response
 *************************************************/

function createJsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))

    .setMimeType(ContentService.MimeType.JSON);
}

/*************************************************
 * Test Devices Sheet
 *************************************************/

function testDevicesSheet() {
  const sheet = getDevicesSheet_();

  Logger.log("Sheet name: " + sheet.getName());

  Logger.log("Last row: " + sheet.getLastRow());

  Logger.log("Last column: " + sheet.getLastColumn());
}
