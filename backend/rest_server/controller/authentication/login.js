const crypto = require("crypto");
const { signJWT } = require("../jwt");

const {
  getUserByCreds,
} = require("../../database/query/user/authentication/user");

const {
  createLogin,
} = require("../../database/query/user/authentication/login");

const {
  loginSchema,
  loginSchemaHeaders,
} = require("./validator");

exports.loginController = async (req, res) => {
  try {
    /* ================= VALIDATION ================= */

    const bodyValidation = loginSchema.validate(req.body);
    const headerValidation = loginSchemaHeaders.validate(
      req.headers?.host
    );

    if (bodyValidation.error || headerValidation.error) {
      return res.status(400).send("Validation failed!");
    }

    /* ================= PREPARE DATA ================= */

    const IPAddress = req.headers?.host;

    const hashedPassword = crypto
      .createHash("sha3-512")
      .update(req.body?.password)
      .digest("hex");

    /* ================= CHECK USER ================= */

    const dbResponse = await getUserByCreds(
      req.body?.email,
      hashedPassword
    );

    let response = {};

    if (!dbResponse) {
      response = {
        status: 400,
        message: "Something went wrong!",
      };

      await createLogin(
        req.body?.email,
        null,
        hashedPassword,
        false,
        IPAddress,
        response.message
      );
    }

    else if (dbResponse?.status === 404) {
      response = {
        status: dbResponse.status,
        message: dbResponse.message,
      };

      await createLogin(
        req.body?.email,
        null,
        hashedPassword,
        false,
        IPAddress,
        response.message
      );
    }

    else {
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
      } else {
        response = {
          status: 500,
          message: "Failed to create JWT!",
        };

        await createLogin(
          req.body?.email,
          dbResponse?.id,
          hashedPassword,
          true,
          IPAddress,
          response.message
        );
      }
    }

    return res.status(response.status).json(response);
  } catch (error) {
    console.error(error);

    return res.status(500).send({
      message: "Internal server error",
    });
  }
};
