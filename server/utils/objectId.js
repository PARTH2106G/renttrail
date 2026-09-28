const mongoose = require('mongoose');
const HttpError = require('./httpError');

const toObjectId = (value, fieldName = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new HttpError(400, `Invalid ${fieldName}`);
  }
  return new mongoose.Types.ObjectId(value);
};

module.exports = { toObjectId };
