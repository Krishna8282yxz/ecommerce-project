/**
 * Modern Premium Ecommerce - Utility JavaScript
 * Handles animations, interactions, and user experience
 */

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

function toggleWishlist(event, productId) {
  event.preventDefault();
  event.stopPropagation();

  const btn = event.target.closest("button");
  if (!btn) return;

  const isActive = btn.classList.contains("active");
  const endpoint = isActive ? "/remove-from-wishlist/" : "/add-to-wishlist/";

  fetch(endpoint + productId, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (data.ok) {
        btn.classList.toggle("active");

        // Update heart icon
        const icon = btn.querySelector("i");

        if (icon) {
          icon.classList.toggle("far");

          icon.classList.toggle("fas");
        }

        // LIVE navbar update
        const wishlistBadge = document.querySelector(".wishlist-count");

        if (wishlistBadge) {
          let count = parseInt(wishlistBadge.innerText) || 0;

          if (!isActive) {
            count++;
          } else {
            count--;
          }

          wishlistBadge.innerText = Math.max(0, count);
        }

        showNotification(data.message, "success");
      } else {
        showNotification(
          "Error: " + (data.error || "Unable to update"),
          "danger",
        );
      }
    })
    .catch((error) => {
      console.error("Wishlist error:", error);
      showNotification("Error: " + error.message, "danger");
    });
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
// SEARCH & AUTOCOMPLETE
// ========================

let searchSuggestionsCache = {};
const searchInput = document.querySelector('input[name="search"]');

if (searchInput) {
  // Create suggestions dropdown
  const suggestionsContainer = document.createElement("div");
  suggestionsContainer.className = "search-suggestions";
  suggestionsContainer.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid var(--border);
    border-top: none;
    border-radius: 0 0 8px 8px;
    max-height: 300px;
    overflow-y: auto;
    z-index: 100;
    display: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  `;

  // Position relative container for suggestions
  const searchBarParent = searchInput.parentElement;
  searchBarParent.style.position = "relative";
  searchBarParent.appendChild(suggestionsContainer);

  // Fetch suggestions
  const fetchSuggestions = debounce(async (query) => {
    if (query.length < 2) {
      suggestionsContainer.style.display = "none";
      return;
    }

    try {
      const response = await fetch(
        `/api/search-suggestions?q=${encodeURIComponent(query)}`,
      );
      const data = await response.json();

      if (data.suggestions && data.suggestions.length > 0) {
        suggestionsContainer.innerHTML = data.suggestions
          .map(
            (suggestion) =>
              `<div class="suggestion-item" style="padding: 10px 15px; cursor: pointer; border-bottom: 1px solid var(--border); transition: background 0.2s;" 
                 onclick="this.parentElement.parentElement.querySelector('input[name=\\\"search\\\"]').value = '${suggestion.replace(/"/g, "&quot;")}'; this.parentElement.parentElement.querySelector('form').submit();"
                 onmouseover="this.style.background='var(--bg-light)'"
                 onmouseout="this.style.background='white'">
                <i class="fas fa-search" style="margin-right: 8px; color: var(--primary);"></i>
                ${suggestion}
              </div>`,
          )
          .join("");
        suggestionsContainer.style.display = "block";
      } else {
        suggestionsContainer.innerHTML = `
          <div style="padding: 15px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
            No suggestions found
          </div>
        `;
        suggestionsContainer.style.display = "block";
      }
    } catch (error) {
      console.error("Suggestion fetch error:", error);
    }
  }, 300);

  // Listen for input changes
  searchInput.addEventListener("input", (e) => {
    fetchSuggestions(e.target.value);
  });

  // Hide suggestions on blur
  searchInput.addEventListener("blur", () => {
    setTimeout(() => {
      suggestionsContainer.style.display = "none";
    }, 200);
  });

  // Show suggestions on focus if input has value
  searchInput.addEventListener("focus", (e) => {
    if (e.target.value.length >= 2) {
      suggestionsContainer.style.display = "block";
    }
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
