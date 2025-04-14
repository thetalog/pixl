const crypto = require("crypto");

function generateGroupId() {
  return crypto.randomUUID();
}

module.exports = generateGroupId;
