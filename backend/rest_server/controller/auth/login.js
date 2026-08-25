const crypto = require("crypto");
const { signJWT } = require("../jwt");

const { getUserByEmailAndPassword } = require("../../database/auth/user");
const { createLogin } = require("../../database/auth/login");
const { loginSchema, loginSchemaHeaders } = require("./validator");

exports.loginController = async (req, res) => {
  try {
    const bodyValidation = loginSchema.validate(req.body);
    const headerValidation = loginSchemaHeaders.validate(req.headers?.host);

    if (bodyValidation.error || headerValidation.error) {
      return res.status(400).json({
        status: 400,
        message: "Validation failed! Check email and password.",
      });
    }

    const IPAddress = req.headers?.host;
    const hashedPassword = crypto
      .createHash("sha3-512")
      .update(req.body?.password)
      .digest("hex");

    const dbResponse = await getUserByEmailAndPassword(
      req.body?.email,
      hashedPassword
    );

    let response = {};

    if (!dbResponse || dbResponse?.error || dbResponse?.status === 404) {
      response = {
        status: 401,
        message: "Invalid email or password.",
      };

      await createLogin(
        req.body?.email,
        null,
        hashedPassword,
        false,
        IPAddress,
        response.message
      );

      return res.status(401).json(response);
    }

    const jwtResponse = await signJWT(
      req.body?.email,
      dbResponse?.name,
      dbResponse?.userName
    );

    if (jwtResponse.status === 201) {
      response = {
        status: 200,
        message: "Login successful!",
        data: jwtResponse.data,
        userName: dbResponse?.userName,
      };

      await createLogin(
        req.body?.email,
        dbResponse?.id,
        hashedPassword,
        true,
        IPAddress,
        response.message
      );

      return res.status(200).json(response);
    }

    response = {
      status: 500,
      message: "Failed to create session. Try again.",
    };

    await createLogin(
      req.body?.email,
      dbResponse?.id,
      hashedPassword,
      true,
      IPAddress,
      response.message
    );

    return res.status(500).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};
