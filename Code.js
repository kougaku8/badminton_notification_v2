/*************************************************
 * badminton_notification_v2
 * Code.gs
 *
 * V2 通知系统 API
 *
 * 功能：
 * 1. Web App 页面
 * 2. Firebase Hosting → GAS GET API
 * 3. Firebase Hosting → GAS POST API
 * 4. checkUserName
 * 5. registerDevice
 * 6. getDeviceStatus
 * 7. enableDevice
 * 8. disableDevice
 *
 * 新增：
 * 9. V1 → V2 Notification API
 * 10. sendNotificationEvent
 * 11. API Key 验证
 *
 * 注意：
 * FCM.gs 不在这里重复实现。
 * 本文件直接调用 FCM.gs 已有的：
 *
 *   sendNotificationToDevice()
 *   sendNotificationToAll()
 *
 *************************************************/


/*************************************************
 * Configuration
 *************************************************/

/*
 * V1 → V2 API Key
 *
 * 不建议直接把真正的 Key 写死在代码里。
 *
 * 请在：
 *
 * Apps Script
 * → 项目设置
 * → 脚本属性
 *
 * 添加：
 *
 * V1_API_KEY
 *
 * 值：
 *
 * 你自己设定的一串随机字符串
 *
 * 例如：
 *
 * V1_API_KEY
 * = badminton_v1_to_v2_2026_xxxxxxxxx
 *
 */

const V1_API_KEY_PROPERTY =
  'V1_API_KEY';


/*************************************************
 * doGet
 *************************************************/

/**
 * GET API
 *
 * 支持：
 *
 * ?action=checkUserName&userName=xxx
 *
 * ?action=registerDevice&deviceId=xxx
 *
 * ?action=getDeviceStatus&deviceId=xxx
 *
 * ?action=enableDevice&deviceId=xxx
 *
 * ?action=disableDevice&deviceId=xxx
 *
 * 没有 action 时：
 * 返回 Notification.html
 */
function doGet(e) {

  try {

    e = e || {};

    const parameter =
      e.parameter || {};

    const action =
      String(
        parameter.action || ''
      ).trim();


    /***********************************************
     * 没有 action
     *
     * → 打开 Notification.html
     ***********************************************/

    if (!action) {

      return HtmlService
        .createTemplateFromFile(
          'Notification'
        )
        .evaluate()
        .setTitle(
          'Badminton Notification V2'
        )
        .setXFrameOptionsMode(
          HtmlService.XFrameOptionsMode.ALLOWALL
        );

    }


    /***********************************************
     * checkUserName
     ***********************************************/

    if (
      action ===
      'checkUserName'
    ) {

      const userName =
        parameter.userName || '';


      return createJsonResponse_(
        apiCheckUserName(
          userName
        )
      );

    }


    /***********************************************
     * registerDevice
     ***********************************************/

    if (
      action ===
      'registerDevice'
    ) {

      const data = {

        deviceId:
          parameter.deviceId || '',

        userName:
          parameter.userName || '',

        fcmToken:
          parameter.fcmToken || '',

        platform:
          parameter.platform || '',

        language:
          parameter.language || 'ja'

      };


      return createJsonResponse_(
        apiRegisterDevice(
          data
        )
      );

    }


    /***********************************************
     * getDeviceStatus
     ***********************************************/

    if (
      action ===
      'getDeviceStatus'
    ) {

      const deviceId =
        parameter.deviceId || '';


      return createJsonResponse_(
        apiGetDeviceStatus(
          deviceId
        )
      );

    }


    /***********************************************
     * enableDevice
     ***********************************************/

    if (
      action ===
      'enableDevice'
    ) {

      const deviceId =
        parameter.deviceId || '';


      return createJsonResponse_(
        apiEnableDevice(
          deviceId
        )
      );

    }


    /***********************************************
     * disableDevice
     ***********************************************/

    if (
      action ===
      'disableDevice'
    ) {

      const deviceId =
        parameter.deviceId || '';


      return createJsonResponse_(
        apiDisableDevice(
          deviceId
        )
      );

    }


    /***********************************************
     * Unknown action
     ***********************************************/

    return createJsonResponse_({

      success:
        false,

      message:
        'Unknown action: ' +
        action

    });

  } catch (error) {

    return createJsonResponse_({

      success:
        false,

      message:
        error &&
        error.message
          ? error.message
          : String(error)

    });

  }

}


/*************************************************
 * doPost
 *************************************************/

/**
 * POST API
 *
 * JSON：
 *
 * {
 *   "action": "...",
 *   "data": {...}
 * }
 *
 *
 * 支持：
 *
 * checkUserName
 * registerDevice
 * getDeviceStatus
 * enableDevice
 * disableDevice
 *
 *
 * 新增：
 *
 * sendNotificationEvent
 */
function doPost(e) {

  try {

    if (!e) {

      throw new Error(
        'POST event がありません。'
      );

    }


    const body =
      e.postData &&
      e.postData.contents
        ? e.postData.contents
        : '';


    if (!body) {

      throw new Error(
        'POST data がありません。'
      );

    }


    let request;

    try {

      request =
        JSON.parse(body);

    } catch (error) {

      throw new Error(
        'JSON の形式が正しくありません。'
      );

    }


    const action =
      String(
        request.action || ''
      ).trim();


    const data =
      request.data || {};


    /***********************************************
     * checkUserName
     ***********************************************/

    if (
      action ===
      'checkUserName'
    ) {

      return createJsonResponse_(
        apiCheckUserName(
          data.userName
        )
      );

    }


    /***********************************************
     * registerDevice
     ***********************************************/

    if (
      action ===
      'registerDevice'
    ) {

      return createJsonResponse_(
        apiRegisterDevice(
          data
        )
      );

    }


    /***********************************************
     * getDeviceStatus
     ***********************************************/

    if (
      action ===
      'getDeviceStatus'
    ) {

      return createJsonResponse_(
        apiGetDeviceStatus(
          data.deviceId
        )
      );

    }


    /***********************************************
     * enableDevice
     ***********************************************/

    if (
      action ===
      'enableDevice'
    ) {

      return createJsonResponse_(
        apiEnableDevice(
          data.deviceId
        )
      );

    }


    /***********************************************
     * disableDevice
     ***********************************************/

    if (
      action ===
      'disableDevice'
    ) {

      return createJsonResponse_(
        apiDisableDevice(
          data.deviceId
        )
      );

    }


    /***********************************************
     * V1 → V2 Notification Event
     ***********************************************/

    if (
      action ===
      'sendNotificationEvent'
    ) {

      return createJsonResponse_(
        apiSendNotificationEvent(
          data
        )
      );

    }


    /***********************************************
     * Unknown action
     ***********************************************/

    return createJsonResponse_({

      success:
        false,

      message:
        'Unknown action: ' +
        action

    });

  } catch (error) {

    return createJsonResponse_({

      success:
        false,

      message:
        error &&
        error.message
          ? error.message
          : String(error)

    });

  }

}


/*************************************************
 * API Wrapper
 *************************************************/


/**
 * checkUserName API
 */
function apiCheckUserName(
  userName
) {

  try {

    return checkUserName(
      userName
    );

  } catch (error) {

    return {

      success:
        false,

      message:
        error.message ||
        String(error)

    };

  }

}


/**
 * registerDevice API
 */
function apiRegisterDevice(
  data
) {

  try {

    return registerDevice(
      data
    );

  } catch (error) {

    return {

      success:
        false,

      message:
        error.message ||
        String(error)

    };

  }

}


/**
 * getDeviceStatus API
 */
function apiGetDeviceStatus(
  deviceId
) {

  try {

    return getDeviceStatus(
      deviceId
    );

  } catch (error) {

    return {

      success:
        false,

      message:
        error.message ||
        String(error)

    };

  }

}


/**
 * enableDevice API
 */
function apiEnableDevice(
  deviceId
) {

  try {

    return enableDevice(
      deviceId
    );

  } catch (error) {

    return {

      success:
        false,

      message:
        error.message ||
        String(error)

    };

  }

}


/**
 * disableDevice API
 */
function apiDisableDevice(
  deviceId
) {

  try {

    return disableDevice(
      deviceId
    );

  } catch (error) {

    return {

      success:
        false,

      message:
        error.message ||
        String(error)

    };

  }

}


/*************************************************
 * V1 → V2 Notification API
 *************************************************/

/**
 * V1 → V2 通知事件
 *
 * V1 发送：
 *
 * {
 *   "action": "sendNotificationEvent",
 *
 *   "data": {
 *
 *     "apiKey": "xxxxxxxx",
 *
 *     "eventType": "ACTIVITY_NEW",
 *
 *     "titleZh": "羽毛球活动通知",
 *
 *     "bodyZh": "9月5日新小仓活动开始报名。",
 *
 *     "titleJa": "バドミントン活動のお知らせ",
 *
 *     "bodyJa": "9月5日の新小倉活動の申込みを開始しました。"
 *
 *   }
 * }
 *
 *
 * 目前第一阶段：
 *
 * ACTIVITY_NEW
 * ACTIVITY_UPDATE
 * ACTIVITY_CANCEL
 *
 * 都可以发送给所有 enabled 设备。
 *
 *
 * 后面可以继续扩展：
 *
 * REGISTRATION_OK
 * WAITLIST_PROMOTE
 * ACTIVITY_REMINDER
 *
 */
function apiSendNotificationEvent(
  data
) {

  try {

    data =
      data || {};


    /***********************************************
     * 1. API Key 验证
     ***********************************************/

    verifyV1ApiKey_(
      data.apiKey
    );


    /***********************************************
     * 2. eventType
     ***********************************************/

    const eventType =
      String(
        data.eventType || ''
      ).trim();


    if (!eventType) {

      throw new Error(
        'eventType がありません。'
      );

    }


    /***********************************************
     * 3. 目前允许的 Event
     ***********************************************/

    const allowedEvents = [

      'ACTIVITY_NEW',

      'ACTIVITY_UPDATE',

      'ACTIVITY_CANCEL',

      'REGISTRATION_OK',

      'WAITLIST_PROMOTE',

      'ACTIVITY_REMINDER'

    ];


    if (
      allowedEvents.indexOf(
        eventType
      ) === -1
    ) {

      throw new Error(
        '不明な eventType: ' +
        eventType
      );

    }


    /***********************************************
     * 4. 标题 / 内容
     *
     * 第一阶段直接使用 V1
     * 传过来的中日文内容。
     *
     * FCM.gs 会根据 Devices.language
     * 自动选择 zh / ja。
     ***********************************************/

    const titleZh =
      String(
        data.titleZh || ''
      ).trim();


    const bodyZh =
      String(
        data.bodyZh || ''
      ).trim();


    const titleJa =
      String(
        data.titleJa || ''
      ).trim();


    const bodyJa =
      String(
        data.bodyJa || ''
      ).trim();


    if (
      !titleZh &&
      !titleJa
    ) {

      throw new Error(
        '通知标题不能为空。'
      );

    }


    if (
      !bodyZh &&
      !bodyJa
    ) {

      throw new Error(
        '通知内容不能为空。'
      );

    }


    /***********************************************
     * 5. 记录事件
     ***********************************************/

    Logger.log(
      '===== V1 → V2 Notification Event ====='
    );

    Logger.log(
      'eventType = ' +
      eventType
    );


    /***********************************************
     * 6. 调用现有 FCM
     *
     * 注意：
     *
     * 这里没有修改 FCM.gs。
     *
     * 直接使用现有：
     *
     * sendNotificationToAll()
     ***********************************************/

    const result =
      sendNotificationToAll({

        titleZh:
          titleZh,

        bodyZh:
          bodyZh,

        titleJa:
          titleJa,

        bodyJa:
          bodyJa

      });


    /***********************************************
     * 7. 返回结果
     ***********************************************/

    return {

      success:
        true,

      eventType:
        eventType,

      message:
        '通知事件处理成功。',

      results:
        result

    };

  } catch (error) {

    Logger.log(
      'V1 → V2 Notification Error: ' +
      (
        error &&
        error.message
          ? error.message
          : String(error)
      )
    );


    return {

      success:
        false,

      message:
        error &&
        error.message
          ? error.message
          : String(error)

    };

  }

}


/*************************************************
 * V1 API Key Verification
 *************************************************/

/**
 * 验证 V1 → V2 API Key
 *
 * Script Properties：
 *
 * V1_API_KEY
 */
function verifyV1ApiKey_(
  apiKey
) {

  const receivedKey =
    String(
      apiKey || ''
    ).trim();


  if (!receivedKey) {

    throw new Error(
      'V1 API Key がありません。'
    );

  }


  const properties =
    PropertiesService
      .getScriptProperties();


  const savedKey =
    String(
      properties.getProperty(
        V1_API_KEY_PROPERTY
      ) || ''
    ).trim();


  if (!savedKey) {

    throw new Error(
      'V1_API_KEY が Script Properties に設定されていません。'
    );

  }


  if (
    receivedKey !==
    savedKey
  ) {

    throw new Error(
      'V1 API Key が正しくありません。'
    );

  }


  return true;

}


/*************************************************
 * JSON Response
 *************************************************/

/**
 * JSON Response
 */
function createJsonResponse_(
  data
) {

  return ContentService
    .createTextOutput(
      JSON.stringify(
        data
      )
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );

}


/*************************************************
 * Test Devices Sheet
 *************************************************/

/**
 * 测试 Devices Sheet
 */
function testDevicesSheet() {

  const sheet =
    getDevicesSheet_();


  Logger.log(
    'Sheet name = ' +
    sheet.getName()
  );


  Logger.log(
    'Last row = ' +
    sheet.getLastRow()
  );


  Logger.log(
    'Last column = ' +
    sheet.getLastColumn()
  );


  return {

    success:
      true,

    sheetName:
      sheet.getName(),

    lastRow:
      sheet.getLastRow(),

    lastColumn:
      sheet.getLastColumn()

  };

}


/*************************************************
 * Test V1 → V2 Notification API
 *************************************************/

/**
 * 在 V2 内部测试 Notification Event。
 *
 * 注意：
 *
 * 这个测试不会经过 doPost。
 *
 * 主要用于确认：
 *
 * Code.gs
 *     ↓
 * apiSendNotificationEvent()
 *     ↓
 * sendNotificationToAll()
 *     ↓
 * FCM.gs
 *
 * 是否正常。
 *
 * 使用前需要已经设置：
 *
 * V1_API_KEY
 */
function testSendNotificationEvent() {

  const properties =
    PropertiesService
      .getScriptProperties();


  const apiKey =
    properties.getProperty(
      V1_API_KEY_PROPERTY
    );


  if (!apiKey) {

    throw new Error(
      '请先设置 V1_API_KEY。'
    );

  }


  const result =
    apiSendNotificationEvent({

      apiKey:
        apiKey,

      eventType:
        'ACTIVITY_NEW',

      titleZh:
        '羽毛球活动通知',

      bodyZh:
        '这是 V2 → FCM 中文测试通知。',

      titleJa:
        'バドミントン活動のお知らせ',

      bodyJa:
        'これはV2 → FCM 日本語テスト通知です。'

    });


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}