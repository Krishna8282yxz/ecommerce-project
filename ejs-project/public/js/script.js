/**
 * Modern Premium Ecommerce - Utility JavaScript
 * Handles animations, interactions, and theme switching
 */

// ========================
// THEME MANAGEMENT
// ========================

function toggleDark() {
  const body = document.body;
  const isDarkMode = body.getAttribute("data-theme") === "dark";

  if (isDarkMode) {
    body.removeAttribute("data-theme");
    body.classList.remove("dark-mode");
    localStorage.setItem("theme", "light");
  } else {
    body.setAttribute("data-theme", "dark");
    body.classList.add("dark-mode");
    localStorage.setItem("theme", "dark");
  }
}

// Load saved theme
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.setAttribute("data-theme", "dark");
    document.body.classList.add("dark-mode");
  }
});

// ========================
// ANIMATIONS
// ========================

// Animate elements on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("slide-up");
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document
  .querySelectorAll(".product-card, .product-detail-container, .hero-content")
  .forEach((el) => {
    observer.observe(el);
  });

// ========================
// NOTIFICATIONS
// ========================

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  const iconMap = {
    success: "check-circle",
    danger: "exclamation-circle",
    warning: "exclamation-triangle",
    info: "info-circle",
  };

  notification.className = `alert alert-${type}`;
  notification.innerHTML = `<i class="fas fa-${iconMap[type] || "info-circle"}"></i> ${message}`;
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transition = "opacity 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ========================
// FORM HANDLING
// ========================

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// ========================
// CART FUNCTIONS
// ========================

function addToCart(productId) {
  window.location.href = `/add-to-cart/${productId}`;
}

function removeFromCart(index) {
  if (confirm("Are you sure you want to remove this item from your cart?")) {
    window.location.href = `/remove/${index}`;
  }
}

// ========================
// WISHLIST MANAGEMENT
// ========================

function toggleWishlist(event) {
  const btn = event.target.closest("button");
  if (!btn) return;

  btn.classList.toggle("active");
  const isActive = btn.classList.contains("active");

  showNotification(
    isActive ? "Added to wishlist!" : "Removed from wishlist!",
    isActive ? "success" : "info",
  );
}

// ========================
// PRODUCT FILTERING
// ========================

function filterProducts(category) {
  const products = document.querySelectorAll(".product-card");
  products.forEach((product) => {
    if (category === "all") {
      product.style.display = "block";
    } else {
      const productCategory = product.getAttribute("data-category");
      product.style.display = productCategory === category ? "block" : "none";
    }
  });
}

// ========================
// SEARCH FUNCTIONALITY
// ========================

function searchProducts(query) {
  const products = document.querySelectorAll(".product-card");
  const lowerQuery = query.toLowerCase();

  products.forEach((product) => {
    const productName =
      product.querySelector(".product-name")?.textContent.toLowerCase() || "";
    const isMatch = productName.includes(lowerQuery);
    product.style.display = isMatch ? "block" : "none";
  });
}

// ========================
// FORM VALIDATION
// ========================

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhoneNumber(phone) {
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.length === 10;
}

function validateForm(formElement) {
  const inputs = formElement.querySelectorAll("[required]");
  let isValid = true;

  inputs.forEach((input) => {
    if (!input.value.trim()) {
      input.style.borderColor = "var(--danger)";
      isValid = false;
    } else {
      input.style.borderColor = "var(--border)";
    }
  });

  return isValid;
}

// ========================
// UTILITY FUNCTIONS
// ========================

// Format currency
function formatCurrency(amount, currency = "₹") {
  return `${currency}${amount.toLocaleString("en-IN")}`;
}

// Format date
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showNotification("Copied to clipboard!", "success");
    })
    .catch(() => {
      showNotification("Failed to copy", "danger");
    });
}

// ========================
// EVENT LISTENERS
// ========================

// Close dropdowns when clicking outside
document.addEventListener("click", (e) => {
  const dropdowns = document.querySelectorAll(".dropdown-menu.active");
  dropdowns.forEach((dropdown) => {
    if (!dropdown.parentElement.contains(e.target)) {
      dropdown.classList.remove("active");
    }
  });
});

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".dropdown-menu.active").forEach((menu) => {
      menu.classList.remove("active");
    });
  }
});

// ========================
// LAZY LOADING IMAGES
// ========================

if ("IntersectionObserver" in window) {
  const lazyImages = document.querySelectorAll("img[data-src]");
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add("loaded");
        imageObserver.unobserve(img);
      }
    });
  });
  lazyImages.forEach((img) => imageObserver.observe(img));
}

// ========================
// ANALYTICS
// ========================

function trackEvent(eventName, eventData = {}) {
  console.log(`📊 Event: ${eventName}`, eventData);
  // Integration point for analytics services
}

// Track page views
document.addEventListener("DOMContentLoaded", () => {
  trackEvent("page_view", { url: window.location.pathname });
});

console.log("✓ Premium Ecommerce Scripts Loaded Successfully");
