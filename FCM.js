/*************************************************
 * badminton_notification_v2
 * FCM.gs
 *
 * Firebase Cloud Messaging HTTP v1
 *
 * 功能：
 * 1. OAuth 2.0 Access Token
 * 2. FCM HTTP v1 发送
 * 3. 中文 / 日文自动切换
 * 4. 批量发送
 * 5. 单设备发送
 * 6. last_sent_at 更新
 * 7. 无效 Token 自动停用
 *
 * Service Account JSON：
 * Script Properties
 * FIREBASE_SERVICE_ACCOUNT_JSON
 *************************************************/


/*************************************************
 * Constants
 *************************************************/

const FCM_SCOPE =
  'https://www.googleapis.com/auth/firebase.messaging';

const FCM_TOKEN_URL =
  'https://oauth2.googleapis.com/token';


/*************************************************
 * Firebase Service Account
 *************************************************/

function getFirebaseServiceAccount_() {

  const properties =
    PropertiesService.getScriptProperties();

  const json =
    properties.getProperty(
      'FIREBASE_SERVICE_ACCOUNT_JSON'
    );

  if (!json) {

    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON が設定されていません。'
    );

  }


  try {

    return JSON.parse(json);

  } catch (error) {

    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON の形式が正しくありません。'
    );

  }

}


/*************************************************
 * Base64 URL Safe
 *************************************************/

function base64UrlEncode_(data) {

  return Utilities
    .base64EncodeWebSafe(data)
    .replace(/=+$/, '');

}


function base64UrlEncodeBytes_(bytes) {

  return Utilities
    .base64EncodeWebSafe(bytes)
    .replace(/=+$/, '');

}


/*************************************************
 * OAuth Access Token
 *************************************************/

function getFirebaseAccessToken_() {

  const serviceAccount =
    getFirebaseServiceAccount_();


  const now =
    Math.floor(
      Date.now() / 1000
    );


  const header = {

    alg: 'RS256',

    typ: 'JWT'

  };


  const claim = {

    iss:
      serviceAccount.client_email,

    scope:
      FCM_SCOPE,

    aud:
      FCM_TOKEN_URL,

    iat:
      now,

    exp:
      now + 3600

  };


  const encodedHeader =
    base64UrlEncode_(
      JSON.stringify(header)
    );


  const encodedClaim =
    base64UrlEncode_(
      JSON.stringify(claim)
    );


  const unsignedToken =
    encodedHeader +
    '.' +
    encodedClaim;


  const signature =
    Utilities.computeRsaSha256Signature(
      unsignedToken,
      serviceAccount.private_key
    );


  const encodedSignature =
    base64UrlEncodeBytes_(
      signature
    );


  const jwt =
    unsignedToken +
    '.' +
    encodedSignature;


  const response =
    UrlFetchApp.fetch(
      FCM_TOKEN_URL,
      {

        method:
          'post',

        contentType:
          'application/x-www-form-urlencoded',

        payload: {

          grant_type:
            'urn:ietf:params:oauth:grant-type:jwt-bearer',

          assertion:
            jwt

        },

        muteHttpExceptions:
          true

      }
    );


  const responseCode =
    response.getResponseCode();


  const responseText =
    response.getContentText();


  if (
    responseCode !== 200
  ) {

    throw new Error(
      'Google OAuth Token 取得失败。HTTP ' +
      responseCode +
      ': ' +
      responseText
    );

  }


  const tokenData =
    JSON.parse(
      responseText
    );


  if (
    !tokenData.access_token
  ) {

    throw new Error(
      'Access Token が取得できませんでした。'
    );

  }


  return tokenData.access_token;

}


/*************************************************
 * FCM Send
 *************************************************/

/**
 * data:
 *
 * {
 *   token: 'FCM_TOKEN',
 *   title: '标题',
 *   body: '内容'
 * }
 */

function sendFcmMessage(
  data
) {

  data =
    data || {};


  const token =
    String(
      data.token || ''
    ).trim();


  const title =
    String(
      data.title ||
      'Badminton Notification'
    );


  const body =
    String(
      data.body || ''
    );


  if (!token) {

    throw new Error(
      'FCM Token がありません。'
    );

  }


  const serviceAccount =
    getFirebaseServiceAccount_();


  const accessToken =
    getFirebaseAccessToken_();


  const projectId =
    serviceAccount.project_id;


  if (!projectId) {

    throw new Error(
      'Firebase project_id がありません。'
    );

  }


  const url =
    'https://fcm.googleapis.com/v1/projects/' +
    encodeURIComponent(
      projectId
    ) +
    '/messages:send';


  const payload = {

    message: {

      token:
        token,

      notification: {

        title:
          title,

        body:
          body

      }

    }

  };


  const response =
    UrlFetchApp.fetch(
      url,
      {

        method:
          'post',

        contentType:
          'application/json',

        headers: {

          Authorization:
            'Bearer ' +
            accessToken

        },

        payload:
          JSON.stringify(
            payload
          ),

        muteHttpExceptions:
          true

      }
    );


  const responseCode =
    response.getResponseCode();


  const responseText =
    response.getContentText();


  Logger.log(
    'FCM HTTP: ' +
    responseCode
  );


  Logger.log(
    'FCM response: ' +
    responseText
  );


  let responseJson = null;


  try {

    responseJson =
      JSON.parse(
        responseText
      );

  } catch (error) {

    responseJson = null;

  }


  if (
    responseCode < 200 ||
    responseCode >= 300
  ) {

    const error =
      new Error(
        'FCM 发送失败。HTTP ' +
        responseCode +
        ': ' +
        responseText
      );


    /*
     * 给调用方附加 FCM 信息
     */

    error.fcmHttpCode =
      responseCode;

    error.fcmResponse =
      responseJson;


    throw error;

  }


  return {

    success:
      true,

    response:
      responseJson

  };

}


/*************************************************
 * Language
 *************************************************/

/**
 * 根据 language 取得通知文字
 *
 * zh = 中文
 * ja = 日本語
 */

function getNotificationText_(
  language,
  customTitle,
  customBody
) {

  const lang =
    language === 'zh'
      ? 'zh'
      : 'ja';


  /*
   * 如果调用方提供自定义标题/内容，
   * 优先使用自定义内容。
   */

  if (
    customTitle ||
    customBody
  ) {

    if (lang === 'zh') {

      return {

        title:
          customTitle ||
          '羽毛球通知',

        body:
          customBody ||
          ''

      };

    }


    return {

      title:
        customTitle ||
        'バドミントン通知',

      body:
        customBody ||
        ''

    };

  }


  /*
   * 默认测试通知
   */

  if (lang === 'zh') {

    return {

      title:
        '羽毛球通知测试',

      body:
        'FCM 测试通知已正常送达。'

    };

  }


  return {

    title:
      'バドミントン通知テスト',

    body:
      'FCM テスト通知が正常に届きました。'

  };

}


/*************************************************
 * Get Enabled Devices
 *************************************************/

/**
 * Devices:
 *
 * A device_id
 * B user_name
 * C fcm_token
 * D enabled
 * E platform
 * F created_at
 * G updated_at
 * H last_sent_at
 * I status
 * J language
 */

function getEnabledDevices_() {

  const sheet =
    getDevicesSheet_();


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow < 2
  ) {

    return [];

  }


  /*
   * 现在是 10 列
   */

  const values =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        10
      )
      .getValues();


  const devices = [];


  values.forEach(
    function(row) {

      const deviceId =
        String(
          row[0] || ''
        ).trim();


      const userName =
        String(
          row[1] || ''
        ).trim();


      const fcmToken =
        String(
          row[2] || ''
        ).trim();


      const enabled =
        row[3] === true;


      const platform =
        String(
          row[4] || ''
        ).trim();


      const status =
        String(
          row[8] || ''
        ).trim();


      /*
       * J 列 language
       *
       * 旧设备没有 language 时，
       * 默认 ja。
       */

      const language =
        String(
          row[9] || ''
        ).trim() === 'zh'
          ? 'zh'
          : 'ja';


      if (
        enabled &&
        fcmToken
      ) {

        devices.push({

          deviceId:
            deviceId,

          userName:
            userName,

          fcmToken:
            fcmToken,

          platform:
            platform,

          status:
            status,

          language:
            language

        });

      }

    }
  );


  return devices;

}


/*************************************************
 * Update last_sent_at
 *************************************************/

function updateLastSentAt_(
  deviceId
) {

  const found =
    findDeviceById_(
      deviceId
    );


  if (!found) {

    return;

  }


  const sheet =
    getDevicesSheet_();


  /*
   * H = last_sent_at
   */

  sheet
    .getRange(
      found.rowNumber,
      8
    )
    .setValue(
      new Date()
    );

}


/*************************************************
 * Disable Invalid Device
 *************************************************/

function disableInvalidDevice_(
  deviceId,
  reason
) {

  const found =
    findDeviceById_(
      deviceId
    );


  if (!found) {

    return;

  }


  const sheet =
    getDevicesSheet_();


  const row =
    found.rowNumber;


  /*
   * D = enabled
   */

  sheet
    .getRange(
      row,
      4
    )
    .setValue(
      false
    );


  /*
   * G = updated_at
   */

  sheet
    .getRange(
      row,
      7
    )
    .setValue(
      new Date()
    );


  /*
   * I = status
   */

  sheet
    .getRange(
      row,
      9
    )
    .setValue(
      'inactive'
    );


  Logger.log(
    'Device disabled: ' +
    deviceId +
    ' / reason: ' +
    reason
  );

}


/*************************************************
 * 判断 FCM Token 是否无效
 *************************************************/

function isInvalidFcmTokenError_(
  error
) {

  if (!error) {

    return false;

  }


  const text =
    String(
      error.message || ''
    ).toLowerCase();


  /*
   * 常见 FCM Invalid Token
   */

  const keywords = [

    'unregistered',

    'registration-token-not-registered',

    'invalid argument',

    'not a valid fcm registration token',

    'requested entity was not found'

  ];


  for (
    let i = 0;
    i < keywords.length;
    i++
  ) {

    if (
      text.indexOf(
        keywords[i]
      ) !== -1
    ) {

      return true;

    }

  }


  return false;

}


/*************************************************
 * Send To One Device
 *************************************************/

/**
 * 单设备发送
 *
 * deviceId
 * title
 * body
 */

function sendNotificationToDevice(
  deviceId,
  title,
  body
) {

  const found =
    findDeviceById_(
      deviceId
    );


  if (!found) {

    return {

      success:
        false,

      deviceId:
        deviceId,

      message:
        '设备不存在。'

    };

  }


  const row =
    found.data;


  const enabled =
    row[3] === true;


  const token =
    String(
      row[2] || ''
    ).trim();


  const language =
    String(
      row[9] || ''
    ).trim() === 'zh'
      ? 'zh'
      : 'ja';


  if (!enabled) {

    return {

      success:
        false,

      deviceId:
        deviceId,

      message:
        '设备通知目前已关闭。'

    };

  }


  if (!token) {

    return {

      success:
        false,

      deviceId:
        deviceId,

      message:
        '设备没有 FCM Token。'

    };

  }


  const text =
    getNotificationText_(
      language,
      title,
      body
    );


  try {

    const result =
      sendFcmMessage({

        token:
          token,

        title:
          text.title,

        body:
          text.body

      });


    updateLastSentAt_(
      deviceId
    );


    return {

      success:
        true,

      deviceId:
        deviceId,

      userName:
        row[1],

      language:
        language,

      title:
        text.title,

      body:
        text.body,

      response:
        result.response

    };

  } catch (error) {

    if (
      isInvalidFcmTokenError_(
        error
      )
    ) {

      disableInvalidDevice_(
        deviceId,
        error.message
      );

    }


    return {

      success:
        false,

      deviceId:
        deviceId,

      userName:
        row[1],

      language:
        language,

      error:
        error.message

    };

  }

}


/*************************************************
 * Test Notification
 *************************************************/

/**
 * 给所有启用设备发送测试通知
 *
 * 中文设备 → 中文
 * 日文设备 → 日文
 */

function sendTestNotification() {

  const devices =
    getEnabledDevices_();


  if (
    devices.length === 0
  ) {

    throw new Error(
      '没有找到 enabled = TRUE 且存在 FCM Token 的设备。'
    );

  }


  const results = [];


  devices.forEach(
    function(device) {

      const result =
        sendNotificationToDevice(
          device.deviceId,
          '',
          ''
        );


      results.push(
        result
      );

    }
  );


  Logger.log(
    JSON.stringify(
      results,
      null,
      2
    )
  );


  return results;

}


/*************************************************
 * Send Custom Notification To All
 *************************************************/

/**
 * 正式通知
 *
 * 参数：
 *
 * {
 *   titleZh: '中文标题',
 *   bodyZh: '中文内容',
 *
 *   titleJa: '日文标题',
 *   bodyJa: '日文内容'
 * }
 *
 *
 * 例如：
 *
 * sendNotificationToAll({
 *
 *   titleZh: '羽毛球活动通知',
 *
 *   bodyZh: '今天 19:00 有羽毛球活动。',
 *
 *   titleJa: 'バドミントンのお知らせ',
 *
 *   bodyJa: '本日19:00からバドミントンがあります。'
 *
 * });
 */

function sendNotificationToAll(
  data
) {

  data =
    data || {};


  const titleZh =
    String(
      data.titleZh || ''
    );


  const bodyZh =
    String(
      data.bodyZh || ''
    );


  const titleJa =
    String(
      data.titleJa || ''
    );


  const bodyJa =
    String(
      data.bodyJa || ''
    );


  const devices =
    getEnabledDevices_();


  if (
    devices.length === 0
  ) {

    throw new Error(
      '没有找到可发送通知的设备。'
    );

  }


  const results = [];


  devices.forEach(
    function(device) {

      let title = '';
      let body = '';


      if (
        device.language === 'zh'
      ) {

        title =
          titleZh;

        body =
          bodyZh;

      } else {

        title =
          titleJa;

        body =
          bodyJa;

      }


      /*
       * 防止某语言为空
       */

      if (!title) {

        title =
          device.language === 'zh'
            ? '羽毛球通知'
            : 'バドミントン通知';

      }


      if (!body) {

        body =
          device.language === 'zh'
            ? '您有新的羽毛球通知。'
            : '新しいバドミントン通知があります。';

      }


      const result =
        sendNotificationToDevice(
          device.deviceId,
          title,
          body
        );


      results.push(
        result
      );

    }
  );


  Logger.log(
    JSON.stringify(
      results,
      null,
      2
    )
  );


  return results;

}


/*************************************************
 * Test Firebase Access Token
 *************************************************/

function testFirebaseAccessToken() {

  const token =
    getFirebaseAccessToken_();


  Logger.log(
    'Access Token obtained successfully.'
  );


  Logger.log(
    'Token length: ' +
    token.length
  );

}


/*************************************************
 * Test One Device
 *************************************************/

/**
 * 使用当前设备 ID 测试
 *
 * 把下面的 deviceId 换成你的设备。
 */

function testOneDevice() {

  const deviceId =
    'device_mtk8voaf_wqf2jsbk';


  const result =
    sendNotificationToDevice(
      deviceId,
      '',
      ''
    );


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}

/*************************************************
 * 中日文通知测试
 *
 * 根据 Devices 表 J列 language：
 *
 * zh → 发送中文
 * ja → 发送日文
 *
 * Devices：
 * A device_id
 * B user_name
 * C fcm_token
 * D enabled
 * E platform
 * F created_at
 * G updated_at
 * H last_sent_at
 * I status
 * J language
 *************************************************/

function testBilingualNotification() {

  const sheet =
    getDevicesSheet_();

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {

    throw new Error(
      'Devices シートに登録された端末がありません。'
    );

  }


  /*
   * 读取 A:J
   */
  const values =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        10
      )
      .getValues();


  const results = [];


  values.forEach(
    function(row, index) {

      const rowNumber =
        index + 2;


      const deviceId =
        String(
          row[0] || ''
        ).trim();


      const userName =
        String(
          row[1] || ''
        ).trim();


      const fcmToken =
        String(
          row[2] || ''
        ).trim();


      const enabled =
        row[3] === true;


      const language =
        String(
          row[9] || ''
        ).trim();


      /*
       * 没有 Device ID
       */
      if (!deviceId) {
        return;
      }


      /*
       * 没有 Token
       */
      if (!fcmToken) {

        results.push({

          row:
            rowNumber,

          deviceId:
            deviceId,

          userName:
            userName,

          success:
            false,

          skipped:
            true,

          reason:
            'FCM Token がありません。'

        });

        return;
      }


      /*
       * 未开启通知
       */
      if (!enabled) {

        results.push({

          row:
            rowNumber,

          deviceId:
            deviceId,

          userName:
            userName,

          success:
            false,

          skipped:
            true,

          reason:
            'enabled = FALSE'

        });

        return;
      }


      /*
       * 根据语言选择通知内容
       */
      let title;
      let body;


      if (language === 'zh') {

        title =
          '羽毛球通知测试';

        body =
          '这是一条中文 FCM 测试通知。';


      } else {

        /*
         * 默认日文
         */
        title =
          'バドミントン通知テスト';

        body =
          'これは日本語のFCMテスト通知です。';

      }


      try {

        const result =
          sendFcmMessage({

            token:
              fcmToken,

            title:
              title,

            body:
              body

          });


        /*
         * 更新 last_sent_at
         *
         * H列
         */
        sheet
          .getRange(
            rowNumber,
            8
          )
          .setValue(
            new Date()
          );


        results.push({

          row:
            rowNumber,

          deviceId:
            deviceId,

          userName:
            userName,

          language:
            language,

          title:
            title,

          success:
            true,

          response:
            result.response

        });


      } catch (error) {

        results.push({

          row:
            rowNumber,

          deviceId:
            deviceId,

          userName:
            userName,

          language:
            language,

          success:
            false,

          error:
            error.message

        });

      }

    }
  );


  Logger.log(
    '===== Bilingual FCM Test ====='
  );


  Logger.log(
    JSON.stringify(
      results,
      null,
      2
    )
  );


  return results;

}


