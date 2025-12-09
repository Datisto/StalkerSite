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
    // const responseTime = Date.now() - startTime;
    // Logging disabled to prevent server hang
  });

  next();
}
