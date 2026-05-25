const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/Order");
const fetchuser = require("../middleware/fetchuser");

// ROUTE 1: Create Payment Intent
router.post("/create-payment-intent", fetchuser, async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress } = req.body;

    if (!items || items.length === 0 || !totalAmount) {
      return res.status(400).json({ error: "Invalid order data" });
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: "inr",
      metadata: {
        userId: req.user.id,
        orderItems: JSON.stringify(items),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error.message);
    res.status(500).json({ error: "Error creating payment: " + error.message });
  }
});

// ROUTE 2: Verify Payment and Create Order
router.post("/verify-payment", fetchuser, async (req, res) => {
  try {
    const { paymentIntentId, items, totalAmount, shippingAddress } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "Payment Intent ID required" });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    // Create normalized order items
    const orderItems = items.map((item) => ({
      product: item._id || item.product || null,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.qty || item.quantity || 1),
      image: item.image || "",
    }));

    const newOrder = new Order({
      user: req.user.id,
      items: orderItems,
      totalAmount: Number(totalAmount),
      paymentStatus: "completed",
      stripePaymentId: paymentIntentId,
      shippingAddress: shippingAddress,
      orderStatus: "processing",
    });

    const savedOrder = await newOrder.save();
    await savedOrder.populate("user").populate("items.product");

    res.json({
      success: true,
      message: "Payment verified and order created",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Error verifying payment:", error.message);
    res
      .status(500)
      .json({ error: "Error verifying payment: " + error.message });
  }
});

// ROUTE 3: Get User Orders
router.get("/get-orders", fetchuser, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("user")
      .populate("items.product")
      .sort({ date: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    res.status(500).json({ error: "Error fetching orders: " + error.message });
  }
});

// ROUTE 4: Get Order by ID
router.get("/get-order/:id", fetchuser, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if order belongs to user
    if (order.user._id.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ error: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error.message);
    res.status(500).json({ error: "Error fetching order: " + error.message });
  }
});

// ROUTE 5: Cancel Order
router.post("/cancel-order/:id", fetchuser, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({ error: "Not authorized" });
    }

    if (order.orderStatus === "shipped" || order.orderStatus === "delivered") {
      return res.status(400).json({ error: "Cannot cancel this order" });
    }

    order.orderStatus = "cancelled";
    await order.save();

    res.json({ success: true, message: "Order cancelled", order });
  } catch (error) {
    console.error("Error cancelling order:", error.message);
    res.status(500).json({ error: "Error cancelling order: " + error.message });
  }
});

module.exports = router;
