const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set in environment variables.");
}

const fetchuser = (req, res, next) => {
  // Get the user from the jwt token and add id to req object
  const token = req.header("auth-token");
  if (!token) {
    return res.status(401).send("Please enter valid token");
  }
  try {
    if (!JWT_SECRET) {
      return res.status(500).send("Server misconfigured: JWT secret missing");
    }
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data.user;
    next();
  } catch (error) {
    return res.status(401).send("Please enter valid token");
  }
};

module.exports = fetchuser;
