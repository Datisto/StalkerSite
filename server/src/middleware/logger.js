import { pool } from '../config/database.js';

const excludedEndpoints = [
  '/health',
  '/api/health'
];

const sensitiveFields = ['password', 'password_hash', 'token', 'secret'];

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.socket.remoteAddress ||
         req.connection.remoteAddress ||
         null;
}

export function requestLogger(req, res, next) {
  if (excludedEndpoints.includes(req.path)) {
    return next();
  }

  const startTime = Date.now();

  const originalSend = res.send;
  const originalJson = res.json;

  let statusCode = null;
  let errorMessage = null;

  res.send = function(data) {
    statusCode = res.statusCode;
    res.send = originalSend;
    return originalSend.call(this, data);
  };

  res.json = function(data) {
    statusCode = res.statusCode;

    if (data && data.error) {
      errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    }

    res.json = originalJson;
    return originalJson.call(this, data);
  };

  res.on('finish', async () => {
    const responseTime = Date.now() - startTime;
    const endpoint = `${req.path}${req.query && Object.keys(req.query).length ? '?' + new URLSearchParams(req.query).toString() : ''}`;

    const logData = {
      method: req.method,
      endpoint: endpoint.substring(0, 500),
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent']?.substring(0, 500) || null,
      user_id: req.user?.id || null,
      admin_id: req.admin?.id || null,
      status_code: statusCode || res.statusCode,
      response_time: responseTime,
      request_body: req.body && Object.keys(req.body).length > 0
        ? JSON.stringify(sanitizeBody(req.body)).substring(0, 5000)
        : null,
      error_message: errorMessage?.substring(0, 1000) || null
    };

    try {
      await pool.query(
        `INSERT INTO request_logs
        (method, endpoint, ip_address, user_agent, user_id, admin_id, status_code, response_time, request_body, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          logData.method,
          logData.endpoint,
          logData.ip_address,
          logData.user_agent,
          logData.user_id,
          logData.admin_id,
          logData.status_code,
          logData.response_time,
          logData.request_body,
          logData.error_message
        ]
      );
    } catch (error) {
      console.error('Failed to log request:', error);
    }
  });

  next();
}
