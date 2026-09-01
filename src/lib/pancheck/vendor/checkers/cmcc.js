const crypto = require('crypto');
const { request } = require('./http');

/**
 * 中国移动云盘链接检测
 * URL格式:
 *   https://yun.139.com/shareweb/#/w/i/{shareID}
 *   https://caiyun.139.com/m/i?{shareID}
 * API: POST https://share-kd-njs.yun.139.com/yun-share/richlifeApp/devapp/IOutLink/getOutLinkInfoV6
 * 请求和响应均通过AES-CBC加密（固定密钥）
 */

const CMCC_AES_KEY = 'PVGDwmcvfs1uV3d1';

function aesCBCEncrypt(plaintext, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(key, 'utf-8'), iv);

  // PKCS7 padding
  const blockSize = 16;
  const padLen = blockSize - (Buffer.byteLength(plaintext, 'utf-8') % blockSize);
  const padded = Buffer.concat([
    Buffer.from(plaintext, 'utf-8'),
    Buffer.alloc(padLen, padLen),
  ]);

  const encrypted = Buffer.concat([cipher.update(padded), cipher.final()]);
  return Buffer.concat([iv, encrypted]).toString('base64');
}

function aesCBCDecrypt(encryptedBase64, key) {
  const rawData = Buffer.from(encryptedBase64, 'base64');
  if (rawData.length < 16) throw new Error('加密数据长度不足');

  const iv = rawData.subarray(0, 16);
  const ciphertext = rawData.subarray(16);

  const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(key, 'utf-8'), iv);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  // 去除PKCS7填充
  const padLen = decrypted[decrypted.length - 1];
  if (padLen > 0 && padLen <= 16) {
    return decrypted.subarray(0, decrypted.length - padLen).toString('utf-8');
  }
  return decrypted.toString('utf-8');
}

async function checkCMCC(link) {
  const shareID = extractShareID(link);
  if (!shareID) {
    return { valid: false, reason: '链接格式无效：无法提取分享ID' };
  }

  try {
    const requestData = {
      getOutLinkInfoReq: {
        account: '',
        linkID: shareID,
        passwd: '',
        caSrt: 1,
        coSrt: 1,
        srtDr: 0,
        bNum: 1,
        pCaID: 'root',
        eNum: 200,
      },
      commonAccountInfo: {
        account: '',
        accountType: 1,
      },
    };

    const jsonStr = JSON.stringify(requestData);
    const encryptedData = aesCBCEncrypt(jsonStr, CMCC_AES_KEY);
    const encryptedJSON = JSON.stringify(encryptedData);

    const { statusCode, body } = await request(
      'https://share-kd-njs.yun.139.com/yun-share/richlifeApp/devapp/IOutLink/getOutLinkInfoV6',
      {
        method: 'POST',
        body: encryptedJSON,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'hcy-cool-flag': '1',
          'x-deviceinfo': '||3|12.27.0|chrome|131.0.0.0|5c7c68368f048245e1ce47f1c0f8f2d0||windows 10|1536X695|zh-CN|||',
        },
      }
    );

    if (statusCode !== 200) {
      return { valid: false, reason: `API返回错误状态码: ${statusCode}` };
    }

    // 解密响应
    const decryptedData = aesCBCDecrypt(body.trim(), CMCC_AES_KEY);
    const response = JSON.parse(decryptedData);

    const resultCode = response.resultCode;
    const desc = response.desc;
    const data = response.data;

    if (resultCode === '0' && data != null) {
      return { valid: true, reason: '' };
    }

    const failReason = desc || (resultCode ? `错误码: ${resultCode}` : '获取分享信息失败');
    return { valid: false, reason: failReason };
  } catch (err) {
    if (err.message === '请求超时') return { valid: false, reason: '请求超时' };
    return { valid: false, reason: `检测失败: ${err.message}` };
  }
}

function extractShareID(shareURL) {
  const match = shareURL.match(/https:\/\/(?:yun\.139\.com\/shareweb\/#\/w\/i\/|caiyun\.139\.com\/m\/i\?)([^&]+)/);
  return match ? match[1] : '';
}

module.exports = { checkCMCC, extractShareID, aesCBCEncrypt, aesCBCDecrypt };