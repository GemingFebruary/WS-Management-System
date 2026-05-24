// cloud/common/response.js - 云函数统一响应格式

/**
 * 成功响应
 */
const success = (data = null, message = 'success') => {
  return {
    code: 200,
    message,
    data
  }
}

/**
 * 错误响应
 */
const error = (code = 500, message = 'error', data = null) => {
  return {
    code,
    message,
    data
  }
}

/**
 * 参数错误响应
 */
const badRequest = (message = '请求参数错误') => {
  return error(400, message)
}

/**
 * 未授权响应
 */
const unauthorized = (message = '未授权') => {
  return error(401, message)
}

/**
 * 权限不足响应
 */
const forbidden = (message = '权限不足') => {
  return error(403, message)
}

/**
 * 资源不存在响应
 */
const notFound = (message = '资源不存在') => {
  return error(404, message)
}

module.exports = {
  success,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound
}
