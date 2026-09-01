const { request } = require('./http');

/**
 * 阿里云盘链接检测
 * URL格式: https://www.alipan.com/s/{share_id} 或 https://www.aliyundrive.com/s/{share_id}
 * API: POST https://api.aliyundrive.com/adrive/v3/share_link/get_share_by_anonymous
 */
async function checkAliyun(link) {
  const { shareId, error: parseError } = extractParamsAliPan(link);
  if (parseError) {
    return { valid: false, reason: '链接格式无效: ' + parseError };
  }

  try {
    const apiURL = `https://api.aliyundrive.com/adrive/v3/share_link/get_share_by_anonymous?share_id=${encodeURIComponent(shareId)}`;
    const { statusCode, body } = await request(apiURL, {
      method: 'POST',
      body: { share_id: shareId },
      headers: {
        'authorization': '',
        'Content-Type': 'application/json',
        'Origin': 'https://www.alipan.com',
        'Referer': 'https://www.alipan.com/',
        'Priority': 'u=1, i',
        'Sec-Ch-Ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'X-Canary': 'client=web,app=share,version=v2.3.1',
      },
    });

    if (statusCode === 429) {
      return { valid: false, reason: 'API频率限制（429错误）', isRateLimited: true };
    }
    if (statusCode !== 200) {
      return { valid: false, reason: `API返回错误状态码: ${statusCode}` };
    }

    JSON.parse(body); // 验证可解析即可
    return { valid: true, reason: '' };
  } catch (err) {
    if (err.message === '请求超时') return { valid: false, reason: '请求超时' };
    return { valid: false, reason: `检测失败: ${err.message}` };
  }
}

function extractParamsAliPan(urlStr) {
  try {
    const u = new URL(urlStr);
    const pathParts = u.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    if (pathParts.length === 0) {
      return { shareId: '', error: 'URL中未找到share_id' };
    }
    const shareId = pathParts[pathParts.length - 1];
    if (!shareId) {
      return { shareId: '', error: '提取的share_id为空' };
    }
    return { shareId, error: null };
  } catch (e) {
    return { shareId: '', error: e.message };
  }
}

module.exports = { checkAliyun, extractParamsAliPan };
