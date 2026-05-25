const jwt = require("jsonwebtoken");
const JWT_SECRET =
  process.env.JWT_SECRET 

const fetchuser = (req, res, next) => {
  // Get the user from the jwt token and add id to req object
  const token = req.header("auth-token");
  if (!token) {
    return res.status(401).send("Please enter valid token");
  }
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data.user;
    next();
  } catch (error) {
    return res.status(401).send("Please enter valid token");
  }
};

module.exports = fetchuser;
