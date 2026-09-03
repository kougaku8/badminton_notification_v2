/*************************************************
 * badminton_notification_v2
 * Device.gs
 *
 * 设备注册、姓名检查、设备启用/停用
 *
 * 重要：
 *
 * Notification.html 不负责 FCM 注册。
 * FCM Token 只由 Firebase Hosting 注册页面取得。
 *
 * Notification.html 只负责：
 *   1. 根据姓名寻找已经注册的设备
 *   2. 查询通知状态
 *   3. 开启通知
 *   4. 关闭通知
 *************************************************/


/*************************************************
 * Configuration
 *************************************************/

const SPREADSHEET_ID =
  '1ZefGVmo1UpUXyxLOD8gPhi8sj0Rju4pJ6uCVm5bVvnM';

const DEVICES_SHEET_NAME =
  'Devices';


/*************************************************
 * 取得 Devices Sheet
 *************************************************/

function getDevicesSheet_() {

  const ss =
    SpreadsheetApp.openById(
      SPREADSHEET_ID
    );

  const sheet =
    ss.getSheetByName(
      DEVICES_SHEET_NAME
    );

  if (!sheet) {

    throw new Error(
      'Devices シートが見つかりません。'
    );

  }

  return sheet;
}


/*************************************************
 * 检查姓名
 *
 * 重要：
 *
 * 不只是返回 exists。
 *
 * 如果已经存在可用设备，
 * 同时返回 deviceId。
 *
 * 返回示例：
 *
 * {
 *   success: true,
 *   exists: true,
 *   count: 2,
 *   deviceId: "device_xxx",
 *   deviceFound: true
 * }
 *************************************************/

function checkUserName(userName) {

  userName =
    String(
      userName || ''
    ).trim();


  if (!userName) {

    return {

      success: false,

      message:
        '姓名不能为空。'

    };

  }


  const sheet =
    getDevicesSheet_();


  const lastRow =
    sheet.getLastRow();


  if (lastRow < 2) {

    return {

      success: true,

      exists: false,

      count: 0,

      deviceFound: false,

      deviceId: ''

    };

  }


  /*
   * Devices：
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

  const values =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        10
      )
      .getValues();


  let count = 0;

  let availableDevice = null;

  let anyDevice = null;


  values.forEach(
    function(row, index) {

      const deviceId =
        String(
          row[0] || ''
        ).trim();


      const registeredName =
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


      const language =
        String(
          row[9] || ''
        ).trim();


      if (
        registeredName !== userName
      ) {

        return;

      }


      count++;


      /*
       * 保存任意已注册设备。
       *
       * 即使 disabled，
       * 也说明这个姓名确实存在设备。
       */

      if (
        !anyDevice &&
        deviceId
      ) {

        anyDevice = {

          rowNumber:
            index + 2,

          deviceId:
            deviceId,

          userName:
            registeredName,

          fcmToken:
            fcmToken,

          enabled:
            enabled,

          platform:
            platform,

          status:
            status,

          language:
            language || 'ja'

        };

      }


      /*
       * 可用于通知的设备：
       *
       * 1. 有 deviceId
       * 2. 有 FCM Token
       * 3. enabled = true
       * 4. status = active
       */

      if (
        !availableDevice &&
        deviceId &&
        fcmToken &&
        enabled &&
        status === 'active'
      ) {

        availableDevice = {

          rowNumber:
            index + 2,

          deviceId:
            deviceId,

          userName:
            registeredName,

          fcmToken:
            fcmToken,

          enabled:
            enabled,

          platform:
            platform,

          status:
            status,

          language:
            language || 'ja'

        };

      }

    }
  );


  /*
   * 完全没有这个姓名
   */

  if (count === 0) {

    return {

      success: true,

      exists: false,

      count: 0,

      deviceFound: false,

      deviceId: ''

    };

  }


  /*
   * 优先返回可用设备
   */

  if (availableDevice) {

    return {

      success: true,

      exists: true,

      count: count,

      deviceFound: true,

      deviceId:
        availableDevice.deviceId,

      userName:
        availableDevice.userName,

      enabled:
        availableDevice.enabled,

      platform:
        availableDevice.platform,

      status:
        availableDevice.status,

      language:
        availableDevice.language

    };

  }


  /*
   * 姓名存在，但是没有：
   *
   * active + enabled + FCM Token
   *
   * 仍然把 deviceId 返回。
   *
   * Notification.html 可以显示：
   * 已注册但通知关闭。
   */

  if (anyDevice) {

    return {

      success: true,

      exists: true,

      count: count,

      deviceFound: true,

      deviceId:
        anyDevice.deviceId,

      userName:
        anyDevice.userName,

      enabled:
        anyDevice.enabled,

      platform:
        anyDevice.platform,

      status:
        anyDevice.status,

      language:
        anyDevice.language

    };

  }


  /*
   * 理论上的异常情况
   */

  return {

    success: true,

    exists: true,

    count: count,

    deviceFound: false,

    deviceId: ''

  };

}


/*************************************************
 * 根据 device_id 查找设备
 *************************************************/

function findDeviceById_(deviceId) {

  deviceId =
    String(
      deviceId || ''
    ).trim();


  if (!deviceId) {

    return null;

  }


  const sheet =
    getDevicesSheet_();


  const lastRow =
    sheet.getLastRow();


  if (lastRow < 2) {

    return null;

  }


  const values =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        10
      )
      .getValues();


  for (
    let i = 0;
    i < values.length;
    i++
  ) {

    if (
      String(values[i][0] || '').trim() ===
      deviceId
    ) {

      return {

        rowNumber:
          i + 2,

        data:
          values[i]

      };

    }

  }


  return null;

}


/*************************************************
 * 注册设备
 *
 * 注意：
 *
 * 只有 Firebase Hosting 注册页面
 * 应该调用这个函数。
 *
 * Notification.html 不调用。
 *************************************************/

function registerDevice(data) {

  data =
    data || {};


  Logger.log(
    'registerDevice data = ' +
    JSON.stringify(data)
  );


  const deviceId =
    String(
      data.deviceId || ''
    ).trim();


  const userName =
    String(
      data.userName || ''
    ).trim();


  const fcmToken =
    String(
      data.fcmToken || ''
    ).trim();


  const platform =
    String(
      data.platform || ''
    ).trim();


  let language =
    String(
      data.language || ''
    ).trim();


  if (
    language !== 'zh' &&
    language !== 'ja'
  ) {

    language = 'ja';

  }


  if (!deviceId) {

    throw new Error(
      'device_id がありません。'
    );

  }


  if (!userName) {

    throw new Error(
      '姓名不能为空。'
    );

  }


  const sheet =
    getDevicesSheet_();


  const now =
    new Date();


  const existing =
    findDeviceById_(
      deviceId
    );


  /*
   * 已有设备
   */

  if (existing) {

    const row =
      existing.rowNumber;


    /*
     * B = user_name
     */

    sheet
      .getRange(
        row,
        2
      )
      .setValue(
        userName
      );


    /*
     * C = fcm_token
     *
     * 只有新 Token 不为空时才更新。
     */

    if (fcmToken) {

      sheet
        .getRange(
          row,
          3
        )
        .setValue(
          fcmToken
        );

    }


    /*
     * D = enabled
     */

    sheet
      .getRange(
        row,
        4
      )
      .setValue(
        true
      );


    /*
     * E = platform
     */

    if (platform) {

      sheet
        .getRange(
          row,
          5
        )
        .setValue(
          platform
        );

    }


    /*
     * G = updated_at
     */

    sheet
      .getRange(
        row,
        7
      )
      .setValue(
        now
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
        'active'
      );


    /*
     * J = language
     */

    sheet
      .getRange(
        row,
        10
      )
      .setValue(
        language
      );


    return {

      success:
        true,

      action:
        'updated',

      deviceId:
        deviceId,

      message:
        '设备信息已更新。'

    };

  }


  /*
   * 新设备
   */

  sheet.appendRow([

    deviceId,

    userName,

    fcmToken,

    true,

    platform,

    now,

    now,

    '',

    'active',

    language

  ]);


  return {

    success:
      true,

    action:
      'created',

    deviceId:
      deviceId,

    message:
      '设备注册成功。'

  };

}


/*************************************************
 * 关闭通知
 *************************************************/

function disableDevice(deviceId) {

  const existing =
    findDeviceById_(
      deviceId
    );


  if (!existing) {

    return {

      success:
        false,

      message:
        '设备不存在。'

    };

  }


  const sheet =
    getDevicesSheet_();


  const row =
    existing.rowNumber;


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


  /*
   * FCM Token 不删除。
   */

  return {

    success:
      true,

    message:
      '通知已关闭。'

  };

}


/*************************************************
 * 开启通知
 *************************************************/

function enableDevice(deviceId) {

  const existing =
    findDeviceById_(
      deviceId
    );


  if (!existing) {

    return {

      success:
        false,

      message:
        '设备不存在。'

    };

  }


  const sheet =
    getDevicesSheet_();


  const row =
    existing.rowNumber;


  /*
   * D = enabled
   */

  sheet
    .getRange(
      row,
      4
    )
    .setValue(
      true
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
      'active'
    );


  return {

    success:
      true,

    message:
      '通知已开启。'

  };

}


/*************************************************
 * 查询设备状态
 *************************************************/

function getDeviceStatus(deviceId) {

  const existing =
    findDeviceById_(
      deviceId
    );


  if (!existing) {

    return {

      success:
        true,

      exists:
        false

    };

  }


  const row =
    existing.data;


  return {

    success:
      true,

    exists:
      true,

    deviceId:
      String(row[0] || ''),

    userName:
      String(row[1] || ''),

    /*
     * 注意：
     *
     * enabled 只看 D 列。
     */

    enabled:
      row[3] === true,

    platform:
      String(row[4] || ''),

    status:
      String(row[8] || ''),

    language:
      String(row[9] || 'ja'),

    /*
     * Notification.html 不需要 Token。
     *
     * 这里仅返回是否存在 Token，
     * 不返回实际 Token。
     */

    hasFcmToken:
      Boolean(
        String(row[2] || '').trim()
      )

  };

}
