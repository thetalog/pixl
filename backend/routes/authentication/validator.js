const Joi = require("joi");

const signupSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  age: Joi.number().integer().min(13).required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  userName: Joi.string().min(3).max(30).required(),
});
const sendOTPSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
});
const verifyOTPSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.number().required(),
});
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
const loginSchemaHeaders = Joi.string();
module.exports = {
  signupSchema,
  sendOTPSchema,
  verifyOTPSchema,
  loginSchema,
  loginSchemaHeaders,
};
