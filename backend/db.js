const mongoose = require("mongoose");

const connectToMongo = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI

    await mongoose.connect(mongoURI);

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
  }
};

module.exports = connectToMongo;
