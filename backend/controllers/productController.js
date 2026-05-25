const Product = require("../models/Product");

// Add product
exports.addProduct = async (req, res) => {
  try {
    const { name, price, description, tag } = req.body;

    const product = new Product({
      name,
      price,
      description,
      tag,
      user: req.user.id,
    });

    const savedProduct = await product.save();
    res.json(savedProduct);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};
