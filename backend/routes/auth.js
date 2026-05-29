const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fetchuser = require("../middleware/fetchuser");

let JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn(
    "WARNING: JWT_SECRET is not set in environment variables. Using development fallback. Set JWT_SECRET in your .env for production.",
  );
  JWT_SECRET = "dev_jwt_secret_change_me"; // dev fallback to avoid crashes during local development
}

// ROUTE 1: creating user -> api/auth/createuser endpoint
router.post(
  "/createuser",
  [
    body("name", "Enter a valid name").notEmpty(),
    body("email", "Enter a valid email").isEmail().normalizeEmail(),
    body("password", "Password must be at least 6 characters long").isLength({
      min: 6,
    }),
  ],

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //checking if any user with the same email-id already exists

    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ error: "Sorry a user with this email already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const securepassword = await bcrypt.hash(req.body.password, salt);
      const requestedRole = req.body.role;
      const role = ["consumer", "seller"].includes(requestedRole)
        ? requestedRole
        : "consumer";

      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: securepassword,
        role,
      });

      data = {
        user: {
          id: user.id,
          role: user.role,
        },
      };
      const jwt_token = jwt.sign(data, JWT_SECRET);
      //res.json(user);
      res.json({ jwt_token });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  },
);

// ROUTE 2:Authenticating user -> api/auth/login endpoint
router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail().normalizeEmail(),
    body("password", "Enter valid password").exists().isLength({ min: 6 }),
  ],

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res
          .status(400)
          .json({ error: "Please enter correct credentials" });
      }

      let passwordcompare = await bcrypt.compare(
        req.body.password,
        user.password,
      );
      console.log("Password Match:", passwordcompare);
      if (!passwordcompare) {
        return res
          .status(400)
          .json({ error: "Please enter valid credentials" });
      }

      data = {
        user: {
          id: user.id,
          role: user.role,
        },
      };

      const jwt_token = jwt.sign(data, JWT_SECRET);
      //res.json(user);
      console.log("Token:", jwt_token);
      res.json({ jwt_token });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  },
);

// ROUTE 3: Get logged in user details -> api/auth/getuser endpoint

router.post("/getuser", fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.send(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/setsession", (req, res) => {
  req.session.user = "Krishna";
  res.send("Session set");
});

router.get("/getsession", (req, res) => {
  res.send(req.session.user);
});

router.get("/testrole", fetchuser, (req, res) => {
  res.json({
    user: req.user,
  });
});

module.exports = router;
