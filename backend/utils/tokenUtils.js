const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m'
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

const generateResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  return {
    token: resetToken,
    hashedToken: hashedToken,
    expire: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  };
};

const generateSessionId = () => {
  return crypto.randomBytes(16).toString('hex');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateResetToken,
  generateSessionId
};