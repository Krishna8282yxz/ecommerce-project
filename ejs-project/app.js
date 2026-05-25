require("dotenv").config();
require("dotenv").config({ path: "../backend/.env" });
const express = require("express");
const session = require("express-session"); // ✅ ADD THIS
const app = express();

const backendUrl =
  process.env.BACKEND_URL || "https://ecommerce-project-alpw.onrender.com";
const apiUrl = (path) => `${backendUrl}${path}`;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// ✅ SESSION SETUP (VERY IMPORTANT)
app.use(
  session({
    secret: "secret123",
    resave: false,
    saveUninitialized: true,
  }),
);

// ✅ CART INITIALIZATION
app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  next();
});

// ✅ GLOBAL MIDDLEWARE (user + message)
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.message = req.session.message;
  res.locals.cartCount = req.session.cart.length;
  res.locals.token = req.session.token;
  res.locals.backendUrl = backendUrl;
  res.locals.stripePublicKey =
    process.env.STRIPE_PUBLIC_KEY || "pk_test_YOUR_STRIPE_PUBLIC_KEY_HERE";
  delete req.session.message;
  next();
});

// ================= ROUTES =================

// Products Data
const products = [
  { id: 1, name: "Laptop", price: 50000, image: "laptop.jpg" },
  { id: 2, name: "Phone", price: 20000, image: "phone.jpg" },
  { id: 3, name: "Shoes", price: 3000, image: "shoes.jpg" },
];

// Home + Search
app.get("/", async (req, res) => {
  try {
    const response = await fetch(apiUrl("/api/products/fetchallproducts"));
    const products = await response.json();

    res.render("index", { products });
  } catch (error) {
    console.error("Failed to load products:", error);
    res.render("index", {
      products: [],
      message: "Unable to load products. Please try again later.",
      messageType: "error",
    });
  }
});

// Static Pages
app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

// Form Submit
app.post("/submit", (req, res) => {
  const { username } = req.body;
  res.send(`Hello ${username}, form submitted successfully!`);
});

// 🛒 VIEW CART
app.get("/cart", (req, res) => {
  res.render("cart", { cart: req.session.cart });
});

// ❌ REMOVE ITEM
app.get("/remove/:index", (req, res) => {
  req.session.cart.splice(req.params.index, 1);
  res.redirect("/cart");
});

// ➕ ADD TO CART
app.get("/add-to-cart/:id", async (req, res) => {
  try {
    const response = await fetch(apiUrl("/api/products/fetchallproducts"));
    const products = await response.json();

    const product = products.find((p) => p._id == req.params.id);

    if (!product) {
      return res.send("Product not found");
    }

    let existing = req.session.cart.find((item) => item._id == product._id);

    if (existing) {
      existing.qty += 1;
    } else {
      req.session.cart.push({ ...product, qty: 1 });
    }

    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.send("Cart error");
  }
});

// checkout page
app.get("/checkout", (req, res) => {
  if (!req.session.token) {
    return res.redirect("/login");
  }

  if (!req.session.cart || req.session.cart.length === 0) {
    return res.redirect("/cart");
  }

  const subtotal = req.session.cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );
  const shipping = subtotal > 5000 ? 0 : 100; // Free shipping above ₹5000
  const tax = Math.round(subtotal * 0.18); // 18% GST
  const total = subtotal + shipping + tax;

  res.render("checkout", {
    cart: req.session.cart,
    subtotal,
    shipping,
    tax,
    total,
    stripePublicKey:
      process.env.STRIPE_PUBLIC_KEY || "pk_test_YOUR_STRIPE_PUBLIC_KEY_HERE",
  });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  try {
    const response = await fetch(apiUrl("/api/auth/createuser"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
      }),
    });

    const data = await response.json();

    if (data.jwt_token) {
      req.session.token = data.jwt_token;
      req.session.user = req.body.email;

      const userRes = await fetch(apiUrl("/api/auth/getuser"), {
        method: "POST",
        headers: {
          "auth-token": data.jwt_token,
        },
      });

      const user = await userRes.json();

      // 4. Save NAME instead of email
      req.session.user = user.name;

      res.redirect("/");
    } else {
      res.send("Signup failed");
    }
  } catch (error) {
    console.log(error);
    res.send("Error");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  try {
    // 1. Login API call
    const response = await fetch(apiUrl("/api/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: req.body.email,
        password: req.body.password,
      }),
    });

    const data = await response.json();

    if (!data.jwt_token) {
      return res.send("Invalid credentials");
    }

    // 2. Save token
    req.session.token = data.jwt_token;

    // 3. Fetch user details
    const userRes = await fetch(apiUrl("/api/auth/getuser"), {
      method: "POST",
      headers: {
        "auth-token": data.jwt_token,
      },
    });

    const user = await userRes.json();

    // 4. Save NAME instead of email
    req.session.user = user.name;

    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.send("Login error");
  }
});

// 🚪 LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/add-product", (req, res) => {
  res.render("addproduct");
});

app.post("/add-product", async (req, res) => {
  try {
    // Validation
    if (!req.body.name || !req.body.price || !req.body.description) {
      return res.send("Error: Name, price, and description are required");
    }

    // Check if token exists
    if (!req.session.token) {
      return res.send("Error: Please login first before adding a product");
    }

    const response = await fetch(apiUrl("/api/products/addproduct"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "auth-token": req.session.token,
      },
      body: JSON.stringify({
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        tag: req.body.tag || "general",
        image: req.body.image || "",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.send("Error: " + (data.error || "Failed to add product"));
    }

    res.redirect("/");
  } catch (error) {
    console.log("Error adding product:", error);
    res.send("Error adding product: " + error.message);
  }
});

app.post("/delete-product/:id", async (req, res) => {
  try {
    if (!req.session.token) {
      return res.send("Error: Please login first");
    }

    const response = await fetch(
      apiUrl(`/api/products/deleteproduct/${req.params.id}`),
      {
        method: "DELETE",
        headers: {
          "auth-token": req.session.token,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return res.send(
        "Error: " + (data.error || data || "Failed to delete product"),
      );
    }

    res.redirect("/");
  } catch (error) {
    console.log("Error deleting product:", error);
    res.send("Delete error: " + error.message);
  }
});

app.get("/edit-product/:id", async (req, res) => {
  try {
    const response = await fetch(apiUrl("/api/products/fetchallproducts"));
    const products = await response.json();

    const product = products.find((p) => p._id == req.params.id);

    if (!product) return res.send("Product not found");

    res.render("editproduct", { product });
  } catch (error) {
    console.log(error);
    res.send("Error loading edit page");
  }
});

app.post("/edit-product/:id", async (req, res) => {
  try {
    if (!req.session.token) {
      return res.send("Error: Please login first");
    }

    if (!req.body.name || !req.body.price || !req.body.description) {
      return res.send("Error: Name, price, and description are required");
    }

    const response = await fetch(
      apiUrl(`/api/products/updateproduct/${req.params.id}`),
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "auth-token": req.session.token,
        },
        body: JSON.stringify({
          name: req.body.name,
          price: Number(req.body.price),
          description: req.body.description,
          tag: req.body.tag || "general",
          image: req.body.image || "",
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return res.send(
        "Error: " + (data.error || data || "Failed to update product"),
      );
    }

    res.redirect("/");
  } catch (error) {
    console.log("Error updating product:", error);
    res.send("Update error: " + error.message);
  }
});

app.get("/product/:id", async (req, res) => {
  try {
    // PRODUCT
    const productRes = await fetch(apiUrl("/api/products/fetchallproducts"));
    const products = await productRes.json();

    const product = products.find((p) => p._id == req.params.id);

    // REVIEWS
    const reviewRes = await fetch(
      apiUrl(`/api/reviews/getreviews/${req.params.id}`),
    );

    let reviews = [];

    if (reviewRes.ok) {
      reviews = await reviewRes.json();
    } else {
      console.log("Review API failed:", await reviewRes.text());
    }

    res.render("product", { product, reviews });
  } catch (error) {
    console.log(error);
    res.send("Error loading product");
  }
});

app.post("/add-review/:id", async (req, res) => {
  try {
    await fetch(apiUrl(`/api/reviews/addreview/${req.params.id}`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "auth-token": req.session.token, // 🔐 IMPORTANT
      },
      body: JSON.stringify({
        text: req.body.text,
        rating: req.body.rating,
      }),
    });

    res.redirect(`/product/${req.params.id}`);
  } catch (error) {
    console.log(error);
    res.send("Error adding review");
  }
});

app.post("/delete-review/:id/:productId", async (req, res) => {
  try {
    await fetch(apiUrl(`/api/reviews/deletereview/${req.params.id}`), {
      method: "DELETE",
      headers: {
        "auth-token": req.session.token,
      },
    });

    res.redirect(`/product/${req.params.productId}`);
  } catch (error) {
    console.log(error);
    res.send("Delete error");
  }
});

app.post("/edit-review/:id/:productId", async (req, res) => {
  try {
    await fetch(apiUrl(`/api/reviews/updatereview/${req.params.id}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "auth-token": req.session.token,
      },
      body: JSON.stringify({
        text: req.body.text,
        rating: req.body.rating,
      }),
    });

    res.redirect(`/product/${req.params.productId}`);
  } catch (error) {
    console.log(error);
    res.send("Update error");
  }
});

// Order Success Page
app.get("/order-success", async (req, res) => {
  try {
    const orderId = req.query.orderId;

    if (!orderId || !req.session.token) {
      return res.redirect("/");
    }

    // Fetch order details from backend
    const response = await fetch(apiUrl(`/api/payment/get-order/${orderId}`), {
      method: "GET",
      headers: {
        "auth-token": req.session.token,
      },
    });

    const order = await response.json();

    if (!response.ok) {
      return res.send("Order not found");
    }

    // Clear cart from session
    req.session.cart = [];

    res.render("order-success", { order });
  } catch (error) {
    console.log("Error loading order success:", error);
    res.send("Error loading order details");
  }
});

// My Orders Page
app.get("/my-orders", async (req, res) => {
  try {
    if (!req.session.token) {
      return res.redirect("/login");
    }

    const response = await fetch(apiUrl("/api/payment/get-orders"), {
      method: "GET",
      headers: {
        "auth-token": req.session.token,
      },
    });

    const orders = await response.json();

    if (!response.ok) {
      return res.render("my-orders", { orders: [] });
    }

    res.render("my-orders", { orders });
  } catch (error) {
    console.log("Error fetching orders:", error);
    res.render("my-orders", { orders: [] });
  }
});

// SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
