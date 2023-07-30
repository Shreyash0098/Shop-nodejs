const crypto = require("crypto");
const bcrypt = require("bcryptjs");
// const nodeMailer = require("nodemailer");
// const sendgridTransport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator/check");

// require("dotenv").config();

const User = require("../models/user");

// const transporter = nodeMailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "your emailid form which you want to send mail",
//     pass: "password which is provided by google ",
//   },
//   tls: {
//     rejectUnauthorized: false,
//   },
// });

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: req.flash("error")[0],
    oldInput: "",
    validationErrors: [],
  });
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: req.flash("error")[0],
    oldInput: "",
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  console.log(req.body);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }
  User.findOne({ email: email })
    .then((user) => {
      console.log(user);
      if (!user) {
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage:
            "Account not found for the given Email Id. Please Sign up",
          oldInput: {
            email: email,
            password: password,
          },
          validationErrors: [],
        });
      }
      bcrypt.compare(password, user.password).then((doMatch) => {
        console.log(doMatch);
        if (doMatch) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save((err) => {
            console.log(err);
            res.redirect("/");
          });
        }
        return res.render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "Invalid password",
          oldInput: {
            email: email,
            password: password,
          },
          validationErrors: [],
        });
      });
    })
    .catch((err) => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return user.save();
    })
    .then((results) => {
      res.redirect("/login");
      return;

      // return sgMail.send(
      //   {
      //     to: email,
      //     from: "your emailid",
      //     subject: "Signup succeeded",
      //     text: "You have successfully signed up on shop. ",
      //     html: "<h1>Sign up Notification</h1>",
      //   },
      //   function (err, info) {
      //     if (err) {
      //       console.log(err);
      //     } else {
      //       console.log("Email Sent successfully", email);
      //     }
      //   }
      // );
    })
    .catch((err) => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

exports.getReset = (req, res, next) => {
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: req.flash("error")[0],
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No account found with this email");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        res.redirect("/");
        return transporter.sendMail({
          to: req.body.email,
          from: "your emailid",
          subject: "Password Reset",
          html: `
          <p> You requested a password reset </p>
          <p> click this <a href="http://localhost:3000/reset/${token} link to set a new passoword </p>
          `,
        });
      })
      .catch((err) => console.log(err));
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: req.flash("error")[0],
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => console.log(err));
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let newUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      newUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      newUser.password = hashedPassword;
      newUser.resetToken = undefined;
      newUser.resetTokenExpiration = undefined;
      return newUser.save();
    })
    .then((result) => {
      console.log("password reset");
      res.redirect("/login");
    })
    .catch((err) => console.log(err));
};
