/*************************************************
 * badminton_notification_v2
 * Device.gs
 *
 * 设备注册、姓名检查、设备启用/停用
 *************************************************/

const SPREADSHEET_ID =
  '1ZefGVmo1UpUXyxLOD8gPhi8sj0Rju4pJ6uCVm5bVvnM';

const DEVICES_SHEET_NAME = 'Devices';


/**
 * 取得 Devices Sheet
 */
function getDevicesSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(DEVICES_SHEET_NAME);

  if (!sheet) {
    throw new Error('Devices シートが見つかりません。');
  }

  return sheet;
}


/**
 * 检查姓名是否已经注册
 *
 * 返回：
 * {
 *   exists: true / false,
 *   count: 已注册设备数量
 * }
 */
function checkUserName(userName) {

  userName = String(userName || '').trim();

  if (!userName) {
    return {
      success: false,
      message: '姓名不能为空。'
    };
  }

  const sheet = getDevicesSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return {
      success: true,
      exists: false,
      count: 0
    };
  }

  const values = sheet
    .getRange(2, 1, lastRow - 1, 9)
    .getValues();

  let count = 0;

  values.forEach(row => {
    const registeredName = String(row[1] || '').trim();

    if (registeredName === userName) {
      count++;
    }
  });

  return {
    success: true,
    exists: count > 0,
    count: count
  };
}


/**
 * 根据 device_id 查找设备
 */
function findDeviceById_(deviceId) {

  deviceId = String(deviceId || '').trim();

  if (!deviceId) {
    return null;
  }

  const sheet = getDevicesSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return null;
  }

  const values = sheet
    .getRange(2, 1, lastRow - 1, 9)
    .getValues();

  for (let i = 0; i < values.length; i++) {

    if (String(values[i][0]) === deviceId) {

      return {
        rowNumber: i + 2,
        data: values[i]
      };
    }
  }

  return null;
}


/**
 * 注册设备
 *
 * 参数：
 * {
 *   deviceId,
 *   userName,
 *   fcmToken,
 *   platform
 * }
 */
function registerDevice(data) {

  data = data || {};

  const deviceId = String(data.deviceId || '').trim();
  const userName = String(data.userName || '').trim();
  const fcmToken = String(data.fcmToken || '').trim();
  const platform = String(data.platform || '').trim();

  if (!deviceId) {
    throw new Error('device_id がありません。');
  }

  if (!userName) {
    throw new Error('姓名不能为空。');
  }

  const sheet = getDevicesSheet_();
  const now = new Date();

  /*
   * 重点：
   * device_id 是设备唯一识别码。
   *
   * 如果同一台设备再次注册，
   * 不新增一行，而是更新原来的记录。
   */
  const existing = findDeviceById_(deviceId);

  if (existing) {

    const row = existing.rowNumber;

    sheet.getRange(row, 2).setValue(userName);

    if (fcmToken) {
      sheet.getRange(row, 3).setValue(fcmToken);
    }

    sheet.getRange(row, 4).setValue(true);

    if (platform) {
      sheet.getRange(row, 5).setValue(platform);
    }

    sheet.getRange(row, 7).setValue(now);
    sheet.getRange(row, 9).setValue('active');

    return {
      success: true,
      action: 'updated',
      message: '设备信息已更新。'
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
    'active'
  ]);

  return {
    success: true,
    action: 'created',
    message: '设备注册成功。'
  };
}


/**
 * 关闭当前设备通知
 *
 * 注意：
 * 不删除 device_id
 * 不删除 FCM Token
 *
 * 只是：
 * enabled = false
 */
function disableDevice(deviceId) {

  const existing = findDeviceById_(deviceId);

  if (!existing) {
    return {
      success: false,
      message: '设备不存在。'
    };
  }

  const sheet = getDevicesSheet_();

  sheet.getRange(existing.rowNumber, 4).setValue(false);
  sheet.getRange(existing.rowNumber, 7).setValue(new Date());

  return {
    success: true,
    message: '通知已关闭。'
  };
}


/**
 * 开启当前设备通知
 */
function enableDevice(deviceId) {

  const existing = findDeviceById_(deviceId);

  if (!existing) {
    return {
      success: false,
      message: '设备不存在。'
    };
  }

  const sheet = getDevicesSheet_();

  sheet.getRange(existing.rowNumber, 4).setValue(true);
  sheet.getRange(existing.rowNumber, 7).setValue(new Date());
  sheet.getRange(existing.rowNumber, 9).setValue('active');

  return {
    success: true,
    message: '通知已开启。'
  };
}


/**
 * 查询当前设备状态
 */
function getDeviceStatus(deviceId) {

  const existing = findDeviceById_(deviceId);

  if (!existing) {

    return {
      success: true,
      exists: false
    };
  }

  const row = existing.data;

  return {
    success: true,
    exists: true,
    deviceId: row[0],
    userName: row[1],
    enabled: row[3] === true,
    platform: row[4],
    status: row[8]
  };
}