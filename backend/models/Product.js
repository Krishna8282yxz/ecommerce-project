const mongoose = require("mongoose");
const { Schema } = mongoose;
const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  tag: {
    type: String,
    default: "general",
  },

  image: {
    type: String,
    default: "",
  },

  seller: {
    type: mongoose.Schema.Types.ObjectId,

    ref: "User",

    required: true,
  },

  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", ProductSchema);
