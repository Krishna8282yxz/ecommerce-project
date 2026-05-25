const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Product = require("../models/Product");
const fetchuser = require("../middleware/fetchuser");
const User = require("../models/User");

//ROUTE: 1 Add review to a product
router.post("/addreview/:productId", fetchuser, async (req, res) => {
  try {
    const { text, rating } = req.body;

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).send("Product not found");
    }

    const review = new Review({
      text,
      rating,
      product: req.params.productId,
      user: req.user.id,
    });

    const savedReview = await review.save();
    res.json(savedReview);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

//ROUTE: 2 Get all reviews for a product
router.get("/getreviews/:productId", async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId })
            .populate("user", "name"); // user ka name bhi milega

        res.json(reviews);

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});


//ROUTE: 3 Delete a review
router.delete("/deletereview/:id", fetchuser, async (req, res) => {
  let review = await Review.findById(req.params.id);

  if (!review) return res.status(404).send("Not found");

  if (review.user.toString() !== req.user.id) {
    return res.status(401).send("Not allowed");
  }

  await Review.findByIdAndDelete(req.params.id);

  res.json({ success: "Deleted" });
});

module.exports = router;