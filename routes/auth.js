const express = require("express");

const { check, body } = require("express-validator/check");

const User = require("../models/user");

const authController = require("../controllers/auth");

const router = express.Router();

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.post(
  "/login",
  [
    check("email")
      .isEmail()
      .withMessage("Please Enter a Valid Email.")
      .normalizeEmail(),
    body(
      "password",
      "Please enter a password with only numbers and texts and atleast 5 characters."
    )
      .isLength({ min: 5 })
      .isAlphanumeric(),
  ],
  authController.postLogin
);

router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please Enter a valid Email.")
      .custom((value, { req }) => {
        console.log(value);
        return User.findOne({ email: value }).then((userDoc) => {
          console.log(userDoc);
          if (userDoc) {
            return Promise.reject(
              "Email already exist.Please use different mail Id."
            );
          }
        });
      })
      .normalizeEmail(),
    body(
      "password",
      "Please enter a password with only numbers and texts and atleast 5 characters."
    )
      .isLength({ min: 5 })
      .isAlphanumeric(),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password and Confirm Password do not match");
      }
      return true;
    }),
  ],
  authController.postSignup
);

router.post("/logout", authController.postLogout);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
