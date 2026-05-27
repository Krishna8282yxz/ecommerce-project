router.post(
  "/createseller",

  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
  ],

  async (req, res) => {
    try {
      let user = await User.findOne({
        email: req.body.email,
      });

      if (user) {
        return res.status(400).json({
          error: "User already exists",
        });
      }

      const salt = await bcrypt.genSalt(10);

      const securepassword = await bcrypt.hash(req.body.password, salt);

      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: securepassword,
        role: "seller",
      });

      const data = {
        user: {
          id: user.id,
          role: user.role,
        },
      };

      const jwt_token = jwt.sign(data, JWT_SECRET);

      res.json({ jwt_token });
    } catch (error) {
      console.error(error.message);

      res.status(500).send("Internal Server Error");
    }
  },
);
