require("dotenv").config();
const express = require("express");
const session = require("express-session"); // ✅ ADD THIS
const app = express();

const backendUrl = process.env.BACKEND_URL;
if (!backendUrl) {
  throw new Error("BACKEND_URL must be set in environment variables");
}
const apiUrl = (path) => `${backendUrl}${path}`;

// 🔒 SAFE FETCH HELPER - Handles errors without JSON parsing crashes
const safeFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);

    // Log for debugging
    console.log(
      `[API] ${options.method || "GET"} ${url} -> ${response.status}`,
    );

    if (!response.ok) {
      // Try to get error message from response
      const contentType = response.headers.get("content-type");
      let errorMsg = `API Error ${response.status}: ${response.statusText}`;

      try {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.message || errorMsg;
        } else {
          const text = await response.text();
          errorMsg = text || errorMsg;
        }
      } catch (e) {
        console.log("Could not parse error response:", e.message);
      }

      const error = new Error(errorMsg);
      error.status = response.status;
      error.response = response;
      throw error;
    }

    // Return both response and parsed data for flexibility
    const contentType = response.headers.get("content-type");
    let data = null;

    try {
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (e) {
      console.log("Error parsing response:", e.message);
      data = null;
    }

    return { ok: true, data, response };
  } catch (error) {
    console.error(
      `[API Error] ${options.method || "GET"} ${url}:`,
      error.message,
    );
    return {
      ok: false,
      error: error.message,
      data: null,
      response: error.response,
    };
  }
};

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

const normalizeRole = (req) => {
  return req.session?.user?.role?.toString().toLowerCase() || null;
};

const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    req.session.message = "Access denied";
    return res.redirect("/");
  }
  next();
};

const requireRoles =
  (...allowedRoles) =>
  (req, res, next) => {
    const role = normalizeRole(req);
    if (!role || !allowedRoles.includes(role)) {
      req.session.message = "Access denied";
      return res.redirect("/");
    }
    next();
  };

const requireConsumer = (req, res, next) => {
  const role = normalizeRole(req);
  if (role !== "consumer") {
    req.session.message = "Access denied";
    return res.redirect("/");
  }
  next();
};

// ✅ CART INITIALIZATION
app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  if (!req.session.wishlist) {
    req.session.wishlist = [];
  }
  next();
});

// ✅ GLOBAL MIDDLEWARE (user + message)
app.use((req, res, next) => {
  res.locals.pageTitle = "Premium Store - Modern Ecommerce";

  res.locals.user = req.session.user || null;

  res.locals.message = req.session.message || null;

  // Safe cart
  req.session.cart = req.session.cart || [];

  res.locals.cartCount = req.session.cart.length;

  // Safe wishlist
  req.session.wishlist = req.session.wishlist || [];

  res.locals.wishlist = req.session.wishlist;

  res.locals.wishlistCount = req.session.wishlist.length;

  res.locals.token = req.session.token || null;

  res.locals.backendUrl = process.env.BACKEND_URL;

  res.locals.stripePublicKey = process.env.STRIPE_PUBLIC_KEY;

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

// Shared product fetch logic
const fetchProductsView = async (req, res, viewName = "index") => {
  try {
    const result = await safeFetch(apiUrl("/api/products/fetchallproducts"));

    let products = [];
    let message = null;
    let messageType = "info";
    let searchQuery = req.query.search
      ? req.query.search.trim().toLowerCase()
      : "";

    if (result.ok && Array.isArray(result.data)) {
      products = result.data;

      // Filter products if search query exists
      if (searchQuery) {
        products = products.filter((product) => {
          const name = product.name ? product.name.toLowerCase() : "";
          const tag = product.tag ? product.tag.toLowerCase() : "";
          const description = product.description
            ? product.description.toLowerCase()
            : "";

          return (
            name.includes(searchQuery) ||
            tag.includes(searchQuery) ||
            description.includes(searchQuery)
          );
        });

        if (products.length === 0) {
          message = `No products found matching "${req.query.search}". Try searching with different keywords.`;
          messageType = "warning";
        } else {
          message = `Found ${products.length} product(s) matching "${req.query.search}"`;
          messageType = "info";
        }
      }

      console.log(`Loaded ${products.length} products`);
    } else if (!result.ok) {
      console.warn("Failed to load products:", result.error);
      message = "Unable to load products. Please try again later.";
      messageType = "error";
    } else {
      console.warn("Unexpected response format:", result.data);
      message = "Products data is unavailable. Please refresh the page.";
      messageType = "error";
    }

    res.render(viewName, { products, message, messageType, searchQuery });
  } catch (error) {
    console.error("Product fetch error:", error);
    res.render(viewName, {
      products: [],
      message: "An unexpected error occurred. Please try again later.",
      messageType: "error",
      searchQuery: "",
    });
  }
};

// Home + Search
app.get("/", async (req, res) => {
  await fetchProductsView(req, res, "index");
});

// Products Page
app.get("/products", async (req, res) => {
  await fetchProductsView(req, res, "index");
});

// ✨ SEARCH SUGGESTIONS API (for autocomplete)
app.get("/api/search-suggestions", async (req, res) => {
  try {
    const query = req.query.q ? req.query.q.trim().toLowerCase() : "";

    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    const result = await safeFetch(apiUrl("/api/products/fetchallproducts"));

    if (!result.ok || !Array.isArray(result.data)) {
      return res.json({ suggestions: [] });
    }

    const suggestions = new Set();
    const products = result.data;

    products.forEach((product) => {
      const name = product.name ? product.name.toLowerCase() : "";
      const tag = product.tag ? product.tag.toLowerCase() : "";

      if (name.includes(query)) {
        suggestions.add(product.name);
      }
      if (tag.includes(query)) {
        suggestions.add(product.tag);
      }
    });

    // Convert set to array, limit to 10 suggestions, sort alphabetically
    const suggestionList = Array.from(suggestions).sort().slice(0, 10);

    res.json({ suggestions: suggestionList });
  } catch (error) {
    console.error("Search suggestions error:", error);
    res.json({ suggestions: [] });
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
app.get("/cart", requireConsumer, (req, res) => {
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
    const result = await safeFetch(apiUrl("/api/products/fetchallproducts"));

    if (!result.ok || !Array.isArray(result.data)) {
      console.error("Failed to fetch products:", result.error);
      return res.send(
        `Error: Unable to add to cart. ${result.error || "Products unavailable"}`,
      );
    }

    const products = result.data;
    const product = products.find((p) => p._id == req.params.id);

    if (!product) {
      return res.send("Error: Product not found");
    }

    let existing = req.session.cart.find((item) => item._id == product._id);

    if (existing) {
      existing.qty += 1;
    } else {
      req.session.cart.push({ ...product, qty: 1 });
    }

    res.redirect("/");
  } catch (error) {
    console.error("Cart error:", error);
    res.send(`Error: Unable to add to cart. ${error.message}`);
  }
});

// ❤️ WISHLIST ROUTES
app.get("/wishlist", (req, res) => {
  res.render("wishlist", { wishlist: req.session.wishlist });
});

app.post("/add-to-wishlist/:id", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.json({ ok: false, error: "Please login first" });
    }

    const result = await safeFetch(apiUrl("/api/products/fetchallproducts"));

    if (!result.ok || !Array.isArray(result.data)) {
      return res.json({
        ok: false,
        error: "Unable to fetch products",
      });
    }

    const products = result.data;
    const product = products.find((p) => p._id == req.params.id);

    if (!product) {
      return res.json({ ok: false, error: "Product not found" });
    }

    const existing = req.session.wishlist.find(
      (item) => item._id == product._id,
    );

    if (existing) {
      return res.json({
        ok: true,
        message: "Product already in wishlist",
        inWishlist: true,
      });
    }

    req.session.wishlist.push({
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      tag: product.tag,
    });

    return res.json({
      ok: true,
      message: "Added to wishlist",
      inWishlist: true,
    });
  } catch (error) {
    console.error("Wishlist add error:", error);
    return res.json({ ok: false, error: error.message });
  }
});

app.post("/remove-from-wishlist/:id", (req, res) => {
  try {
    const index = req.session.wishlist.findIndex(
      (item) => item._id == req.params.id,
    );

    if (index > -1) {
      req.session.wishlist.splice(index, 1);
    }

    return res.json({
      ok: true,
      message: "Removed from wishlist",
      inWishlist: false,
    });
  } catch (error) {
    console.error("Wishlist remove error:", error);
    return res.json({ ok: false, error: error.message });
  }
});

// checkout page
app.get("/checkout", requireConsumer, (req, res) => {
  if (!req.session.token) {
    req.session.message = "Access denied";
    return res.redirect("/");
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
    const result = await safeFetch(apiUrl("/api/auth/createuser"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role || "consumer", // 🔐 Include role, default to consumer
      }),
    });

    if (!result.ok || !result.data?.jwt_token) {
      return res.send(
        `Error: Registration failed. ${result.error || "Invalid response from server"}`,
      );
    }

    req.session.token = result.data.jwt_token;

    const userResult = await safeFetch(apiUrl("/api/auth/getuser"), {
      method: "POST",
      headers: {
        "auth-token": result.data.jwt_token,
      },
    });

    // 🔐 Store full user object with role
    if (userResult.ok && userResult.data) {
      req.session.user = {
        name: userResult.data.name,
        email: userResult.data.email,
        role: userResult.data.role || "consumer",
        _id: userResult.data._id,
      };
    } else {
      // Fallback if getuser fails
      req.session.user = {
        _id: null,
        name: req.body.name,
        email: req.body.email,
        role: req.body.role || "consumer",
      };
    }

    res.redirect("/");
  } catch (error) {
    console.error("Registration error:", error);
    res.send(`Error: Registration failed. ${error.message}`);
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  try {
    // 1. Login API call
    const result = await safeFetch(apiUrl("/api/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: req.body.email,
        password: req.body.password,
      }),
    });

    if (!result.ok || !result.data?.jwt_token) {
      return res.send(
        `Error: Login failed. ${result.error || "Invalid credentials"}`,
      );
    }

    // 2. Save token
    req.session.token = result.data.jwt_token;

    // 3. Fetch user details
    const userResult = await safeFetch(apiUrl("/api/auth/getuser"), {
      method: "POST",
      headers: {
        "auth-token": result.data.jwt_token,
      },
    });

    // 4. Store full user object with role
    if (userResult.ok && userResult.data) {
      req.session.user = {
        name: userResult.data.name,
        email: userResult.data.email,
        role: userResult.data.role || "consumer",
        _id: userResult.data._id,
      };
    } else {
      req.session.user = {
        _id: null,
        name: req.body.email,
        email: req.body.email,
        role: "consumer",
      };
    }

    res.redirect("/");
  } catch (error) {
    console.error("Login error:", error);
    res.send(`Error: Login failed. ${error.message}`);
  }
});

// 🚪 LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/add-product", requireRoles("seller", "admin"), (req, res) => {
  res.render("addproduct");
});

app.post("/add-product", requireRoles("seller", "admin"), async (req, res) => {
  try {
    // Validation
    if (!req.body.name || !req.body.price || !req.body.description) {
      return res.send("Error: Name, price, and description are required");
    }

    // Check if token exists
    if (!req.session.token) {
      return res.send("Error: Please login first before adding a product");
    }

    const result = await safeFetch(apiUrl("/api/products/addproduct"), {
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

    if (!result.ok) {
      return res.send(`Error: ${result.error || "Failed to add product"}`);
    }

    res.redirect("/");
  } catch (error) {
    console.error("Error adding product:", error);
    res.send(`Error: Failed to add product. ${error.message}`);
  }
});

app.post(
  "/delete-product/:id",
  requireRoles("seller", "admin"),
  async (req, res) => {
    try {
      if (!req.session.token) {
        return res.send("Error: Please login first");
      }

      const result = await safeFetch(
        apiUrl(`/api/products/deleteproduct/${req.params.id}`),
        {
          method: "DELETE",
          headers: {
            "auth-token": req.session.token,
          },
        },
      );

      if (!result.ok) {
        return res.send(`Error: ${result.error || "Failed to delete product"}`);
      }

      res.redirect("/");
    } catch (error) {
      console.error("Error deleting product:", error);
      res.send(`Error: Failed to delete product. ${error.message}`);
    }
  },
);

app.get(
  "/edit-product/:id",
  requireRoles("seller", "admin"),
  async (req, res) => {
    try {
      const result = await safeFetch(apiUrl("/api/products/fetchallproducts"));

      if (!result.ok || !Array.isArray(result.data)) {
        console.error("Failed to fetch products:", result.error);
        return res.send(
          `Error: Unable to load product. ${result.error || "Products unavailable"}`,
        );
      }

      const products = result.data;
      const product = products.find((p) => p._id == req.params.id);

      if (!product) return res.send("Error: Product not found");

      res.render("editproduct", { product });
    } catch (error) {
      console.error("Error loading edit page:", error);
      res.send(`Error: Unable to load product. ${error.message}`);
    }
  },
);

app.post(
  "/edit-product/:id",
  requireRoles("seller", "admin"),
  async (req, res) => {
    try {
      if (!req.session.token) {
        return res.send("Error: Please login first");
      }

      if (!req.body.name || !req.body.price || !req.body.description) {
        return res.send("Error: Name, price, and description are required");
      }

      const result = await safeFetch(
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

      if (!result.ok) {
        return res.send(`Error: ${result.error || "Failed to update product"}`);
      }

      res.redirect("/");
    } catch (error) {
      console.error("Error updating product:", error);
      res.send(`Error: Failed to update product. ${error.message}`);
    }
  },
);

app.get("/product/:id", async (req, res) => {
  try {
    // PRODUCT
    const productResult = await safeFetch(
      apiUrl("/api/products/fetchallproducts"),
    );

    if (!productResult.ok || !Array.isArray(productResult.data)) {
      console.error("Failed to fetch products:", productResult.error);
      return res.send(
        `Error: Unable to load product. ${productResult.error || "Products unavailable"}`,
      );
    }

    const products = productResult.data;
    const product = products.find((p) => p._id == req.params.id);

    if (!product) {
      return res.send("Error: Product not found");
    }

    // REVIEWS
    const reviewResult = await safeFetch(
      apiUrl(`/api/reviews/getreviews/${req.params.id}`),
    );

    let reviews = [];

    if (reviewResult.ok && Array.isArray(reviewResult.data)) {
      reviews = reviewResult.data;
    } else if (!reviewResult.ok) {
      console.log("Review API failed:", reviewResult.error);
    }

    res.render("product", { product, reviews });
  } catch (error) {
    console.error("Error loading product:", error);
    res.send(`Error: Unable to load product. ${error.message}`);
  }
});

app.post("/add-review/:id", requireConsumer, async (req, res) => {
  try {
    if (!req.session.token) {
      return res.send("Error: Please login to add a review");
    }

    const result = await safeFetch(
      apiUrl(`/api/reviews/addreview/${req.params.id}`),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": req.session.token,
        },
        body: JSON.stringify({
          text: req.body.text,
          rating: req.body.rating,
        }),
      },
    );

    if (!result.ok) {
      console.error("Failed to add review:", result.error);
    }

    res.redirect(`/product/${req.params.id}`);
  } catch (error) {
    console.error("Error adding review:", error);
    res.send(`Error: Failed to add review. ${error.message}`);
  }
});

app.post("/delete-review/:id/:productId", requireConsumer, async (req, res) => {
  try {
    if (!req.session.token) {
      return res.send("Error: Please login to delete a review");
    }

    const result = await safeFetch(
      apiUrl(`/api/reviews/deletereview/${req.params.id}`),
      {
        method: "DELETE",
        headers: {
          "auth-token": req.session.token,
        },
      },
    );

    if (!result.ok) {
      console.error("Failed to delete review:", result.error);
    }

    res.redirect(`/product/${req.params.productId}`);
  } catch (error) {
    console.error("Error deleting review:", error);
    res.send(`Error: Failed to delete review. ${error.message}`);
  }
});

app.post("/edit-review/:id/:productId", requireConsumer, async (req, res) => {
  try {
    if (!req.session.token) {
      return res.send("Error: Please login to edit a review");
    }

    const result = await safeFetch(
      apiUrl(`/api/reviews/updatereview/${req.params.id}`),
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "auth-token": req.session.token,
        },
        body: JSON.stringify({
          text: req.body.text,
          rating: req.body.rating,
        }),
      },
    );

    if (!result.ok) {
      console.error("Failed to update review:", result.error);
    }

    res.redirect(`/product/${req.params.productId}`);
  } catch (error) {
    console.error("Error updating review:", error);
    res.send(`Error: Failed to update review. ${error.message}`);
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
    const result = await safeFetch(
      apiUrl(`/api/payment/get-order/${orderId}`),
      {
        method: "GET",
        headers: {
          "auth-token": req.session.token,
        },
      },
    );

    if (!result.ok) {
      console.error("Failed to fetch order:", result.error);
      return res.send(
        `Error: Order not found. ${result.error || "Unable to load order details"}`,
      );
    }

    const order = result.data;

    // Clear cart from session
    req.session.cart = [];

    res.render("order-success", { order });
  } catch (error) {
    console.error("Error loading order success:", error);
    res.send(`Error: Unable to load order details. ${error.message}`);
  }
});

// My Orders Page
app.get("/my-orders", requireConsumer, async (req, res) => {
  try {
    if (!req.session.token) {
      req.session.message = "Access denied";
      return res.redirect("/");
    }

    const result = await safeFetch(apiUrl("/api/payment/get-orders"), {
      method: "GET",
      headers: {
        "auth-token": req.session.token,
      },
    });

    let orders = [];

    if (result.ok && Array.isArray(result.data)) {
      orders = result.data;
    } else if (!result.ok) {
      console.error("Failed to fetch orders:", result.error);
    }

    res.render("my-orders", { orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.render("my-orders", { orders: [] });
  }
});

// My Products Page
app.get("/my-products", requireRoles("seller", "admin"), async (req, res) => {
  try {
    if (!req.session.token) {
      req.session.message = "Access denied";
      return res.redirect("/");
    }

    const result = await safeFetch(apiUrl("/api/products/myproducts"), {
      method: "GET",
      headers: {
        "auth-token": req.session.token,
      },
    });

    let products = [];
    let message = null;
    let messageType = "info";

    if (result.ok && Array.isArray(result.data)) {
      products = result.data;
    } else {
      message = "Unable to load your products. Please try again later.";
      messageType = "error";
      console.error("Failed to fetch my products:", result.error);
    }

    res.render("my-products", { products, message, messageType });
  } catch (error) {
    console.error("Error fetching my products:", error);
    res.render("my-products", {
      products: [],
      message: "An unexpected error occurred while loading products.",
      messageType: "error",
    });
  }
});

// SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
