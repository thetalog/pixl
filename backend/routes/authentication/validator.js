const Joi = require("joi");

const signupSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  age: Joi.number().integer().min(13).required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
const sendOTPSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
});
const verifyOTPSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.number().required(),
});
module.exports = {
  signupSchema,
  sendOTPSchema,
  verifyOTPSchema,
};
