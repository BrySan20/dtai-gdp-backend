// File: backend/src/utils/passwordHash.js
const bcrypt = require('bcrypt');
const config = require('../config/config');

const hashPassword = async (password) => {
  return await bcrypt.hash(password, config.security.bcryptRounds);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = {
  hashPassword,
  comparePassword
};