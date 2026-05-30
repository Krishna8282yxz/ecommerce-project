const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const fetchuser = require("../middleware/fetchuser");
const { addProduct, getProducts } = require("../controllers/productController");
const roleAuth = require("../middleware/roleAuth");
//ROUTE:1 Add Product
router.post(
  "/addproduct",
  fetchuser,
  roleAuth("seller", "admin"),
  async (req, res) => {
    try {
      const { name, price, description, tag, image } = req.body;

      // Validation
      if (!name || !price || !description) {
        return res
          .status(400)
          .json({ error: "Name, price, and description are required" });
      }

      const product = new Product({
        name,
        price: Number(price),
        description,
        tag: tag || "general",
        image: image || "",
        seller: req.user.id,
      });

      const savedProduct = await product.save();
      res.json(savedProduct);
    } catch (error) {
      console.error("Error adding product:", error.message);
      res.status(500).json({ error: "Error adding product: " + error.message });
    }
  },
);

//ROUTE:2 Get all products
router.get("/fetchallproducts", async (req, res) => {
  try {
    console.log("FETCH PRODUCTS HIT");

    const products = await Product.find().populate("seller", "name email");

    console.log("Products:", products.length);

    res.json(products);
  } catch (error) {
    console.error("FULL PRODUCT ERROR:");

    console.error(error);

    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
});

const mongoose = require("mongoose");

//ROUTE:3 Update product
router.put(
  "/updateproduct/:id",
  fetchuser,
  roleAuth("admin", "seller"),
  async (req, res) => {
    try {
      const id = req.params.id.trim();

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const { name, price, description, tag } = req.body;

      const newProduct = {};
      if (name) newProduct.name = name;
      if (price) newProduct.price = Number(price);
      if (description) newProduct.description = description;
      if (tag) newProduct.tag = tag;

      let product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      //Ownership check
      if (
        product.seller.toString() !== req.user.id &&
        req.user.role !== "admin"
      ) {
        return res
          .status(401)
          .json({ error: "You are not authorized to update this product" });
      }

      product = await Product.findByIdAndUpdate(
        id,
        { $set: newProduct },
        { new: true },
      );

      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error.message);
      res
        .status(500)
        .json({ error: "Error updating product: " + error.message });
    }
  },
);

//ROUTE 4: Delete product
router.delete(
  "/deleteproduct/:id",
  fetchuser,
  roleAuth("admin", "seller"),
  async (req, res) => {
    try {
      const id = req.params.id.trim();

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      let product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (
        product.seller.toString() !== req.user.id &&
        req.user.role !== "admin"
      ) {
        return res
          .status(401)
          .json({ error: "You are not authorized to delete this product" });
      }

      await Product.findByIdAndDelete(id);

      res.json({ success: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error.message);
      res
        .status(500)
        .json({ error: "Error deleting product: " + error.message });
    }
  },
);

//ROUTE 5: Get products by seller
router.get(
  "/myproducts",
  fetchuser,
  roleAuth("seller", "admin"),
  async (req, res) => {
    let products;
    try {
      if (req.user.role === "admin") {
        products = await Product.find().populate("seller", "name email");
        return res.json(products);
      } else {
        products = await Product.find({ seller: req.user.id }).populate(
          "seller",
          "name email",
        );
      }
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error.message);
      res
        .status(500)
        .json({ error: "Error fetching products: " + error.message });
    }
  },
);

module.exports = router;
