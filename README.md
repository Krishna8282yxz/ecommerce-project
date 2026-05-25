# E-Commerce Platform

A full-stack e-commerce application built with **Node.js**, **Express.js**, **MongoDB**, and **EJS** templating. The platform includes user authentication, product management, shopping cart functionality, product reviews, and user notes.

## 📋 Project Structure

```
Ecommerce/
├── backend/                    # API Server
│   ├── db.js                  # MongoDB Connection
│   ├── index.js               # Express Server Entry Point
│   ├── .env                   # Environment Variables
│   ├── package.json           # Backend Dependencies
│   ├── controllers/
│   │   └── productController.js
│   ├── middleware/
│   │   ├── auth.js            # Authentication Middleware
│   │   └── fetchuser.js       # Fetch User Data Middleware
│   ├── models/
│   │   ├── User.js            # User Schema
│   │   ├── Product.js         # Product Schema
│   │   ├── Review.js          # Review Schema
│   │   └── Order.js           # Order Schema (NEW)
│   └── routes/
│       ├── auth.js            # Authentication Routes
│       ├── products.js        # Product Routes
│       ├── review.js          # Review Routes
│       └── payment.js         # Payment Routes (NEW)
│
└── ejs-project/               # Frontend (EJS Templating)
    ├── app.js                 # Express App Entry Point
    ├── package.json           # Frontend Dependencies
    ├── public/
    │   ├── css/
    │   │   └── style.css      # Styling
    │   ├── image/             # Product & Static Images
    │   └── js/
    │       └── script.js      # Client-side JavaScript
    └── views/
        ├── index.ejs          # Home Page
        ├── product.ejs        # Product Details
        ├── cart.ejs           # Shopping Cart
        ├── checkout.ejs       # Checkout Page with Stripe (UPDATED)
        ├── order-success.ejs  # Order Confirmation (NEW)
        ├── my-orders.ejs      # Order History (NEW)
        ├── login.ejs          # Login Page
        ├── register.ejs       # User Registration
        ├── addproduct.ejs     # Add New Product
        ├── editproduct.ejs    # Edit Product
        ├── editreview.ejs     # Edit Review
        ├── contact.ejs        # Contact Page
        ├── about.ejs          # About Page
        └── partials/
            ├── header.ejs     # Header Component
            ├── navbar.ejs     # Navigation Bar (UPDATED)
            └── footer.ejs     # Footer Component
```

## 🎯 Features

- **User Authentication**: Register, login, and JWT-based authentication
- **Product Management**: Create, read, update, and delete products
- **Shopping Cart**: Add/remove items, manage cart with sessions
- **Product Reviews**: Users can write and edit product reviews
- **💳 Payment Gateway**: Stripe integration for secure payments
- **📦 Order Management**: Track orders, view order history, cancel orders
- **🚚 Shipping Address**: Collect and save shipping information
- **Session Management**: Secure session handling with express-session
- **Password Encryption**: Passwords secured with bcryptjs
- **Responsive UI**: EJS templates with CSS styling

## 🛠️ Tech Stack

**Backend:**

- Node.js
- Express.js v5.2.1
- MongoDB with Mongoose v9.3.1
- JWT (jsonwebtoken) for authentication
- bcryptjs for password encryption
- CORS for cross-origin requests
- express-validator for input validation
- **Stripe** for payment processing

**Frontend:**

- EJS v5.0.1
- Express.js v5.2.1
- HTML/CSS/JavaScript
- Express Sessions
- **Stripe.js** for payment UI

## 📦 Prerequisites

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **MongoDB** (Local or Atlas Account)
- **Git** (optional, for version control)

## 🚀 Installation & Setup

### Step 1: Clone or Download the Project

```bash
cd Ecommerce
```

### Step 2: Setup Backend

#### 2.1 Navigate to Backend Directory

```bash
cd backend
```

#### 2.2 Install Dependencies

```bash
npm install
```

#### 2.3 Configure Environment Variables

Create a `.env` file in the `backend` directory (if not already present):

```env
PORT=5000
MONGODB_URI=mongodb+srv://Krishna:krishna1234@cluster0.7i3o2qi.mongodb.net/inotebook?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

**Note:** The current MongoDB connection URI is hardcoded in `db.js`. For production, update it with your own MongoDB Atlas credentials.

#### 2.4 Start Backend Server

**Using Node:**

```bash
node index.js
```

**Using Nodemon (recommended for development):**

```bash
npx nodemon index.js
```

✅ Backend will start on `http://localhost:5000`

### Step 3: Setup Frontend

#### 3.1 Navigate to Frontend Directory

Open a new terminal and navigate to the frontend:

```bash
cd ejs-project
```

#### 3.2 Install Dependencies

```bash
npm install
```

#### 3.3 Configure Backend URL (if needed)

Check `app.js` to ensure the backend API URL is correctly set:

```javascript
const response = await fetch(
  "http://localhost:5000/api/products/fetchallproducts",
);
```

#### 3.4 Start Frontend Server

```bash
node app.js
```

✅ Frontend will start on `http://localhost:3000` (or the default port in your app.js)

## 🔧 Project Configuration

### Backend Configuration (backend/db.js)

The MongoDB connection is currently hardcoded. Update with your credentials:

```javascript
await mongoose.connect("your-mongodb-uri");
```

### 💳 Stripe Payment Gateway Setup

1. **Create a Stripe Account**: Go to [stripe.com](https://stripe.com) and sign up
2. **Get API Keys**:
   - Go to Dashboard → Developers → API Keys
   - Copy both **Publishable Key** and **Secret Key**

3. **Update backend/.env file**:

```env
STRIPE_PUBLIC_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

4. **For Production** (replace `test` with actual keys):

```env
STRIPE_PUBLIC_KEY=pk_live_your_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
```

5. **Test Cards** (for development):
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

### Session & Security

**Backend Session Secret (backend/index.js):**

```javascript
secret: "mysupersecretkey"; // Change this in production
```

**Frontend Session Secret (ejs-project/app.js):**

```javascript
secret: "secret123"; // Change this in production
```

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/getuser` - Get user details (protected)

### Products Routes (`/api/products`)

- `GET /api/products/fetchallproducts` - Fetch all products
- `POST /api/products/addproduct` - Add new product (protected)
- `PUT /api/products/updateproduct/:id` - Update product (protected)
- `DELETE /api/products/deleteproduct/:id` - Delete product (protected)

### Reviews Routes (`/api/reviews`)

- `POST /api/reviews/addreview` - Add product review (protected)
- `GET /api/reviews/reviewbyproduct/:id` - Get product reviews
- `PUT /api/reviews/updatereview/:id` - Update review (protected)
- `DELETE /api/reviews/deletereview/:id` - Delete review (protected)

### Payment Routes (`/api/payment`) 💳

- `POST /api/payment/create-payment-intent` - Create Stripe payment intent (protected)
- `POST /api/payment/verify-payment` - Verify payment and create order (protected)
- `GET /api/payment/get-orders` - Get user's orders (protected)
- `GET /api/payment/get-order/:id` - Get order details (protected)
- `POST /api/payment/cancel-order/:id` - Cancel an order (protected)

## 📝 Frontend Pages

- **/** - Home page with product listing
- **/product/:id** - Product detail page
- **/cart** - Shopping cart
- **/checkout** - Secure payment checkout with Stripe
- **/order-success** - Order confirmation page
- **/my-orders** - User's order history
- **/login** - User login
- **/register** - User registration
- **/addproduct** - Add new product form
- **/editproduct/:id** - Edit product
- **/editreview/:id** - Edit review
- **/about** - About page
- **/contact** - Contact page

## 🔐 Security Notes

⚠️ **Important for Production:**

1. Change session secrets in both `backend/index.js` and `ejs-project/app.js`
2. Use environment variables for sensitive data (MongoDB URI, JWT secret)
3. Implement HTTPS
4. Add input validation and sanitization
5. Update CORS configuration for production domains
6. Use `npm audit` to check for vulnerabilities

```bash
npm audit
```

## 🧪 Testing the Application

1. **Register a new user**
   - Navigate to `/register`
   - Fill in user details
   - Submit

2. **Login**
   - Navigate to `/login`
   - Enter credentials
   - Access protected pages

3. **Add Products**
   - As a logged-in user, navigate to `/addproduct`
   - Fill in product details
   - Save

4. **Add to Cart**
   - Browse products
   - Click "Add to Cart"
   - View cart at `/cart`

5. **Write Reviews**
   - On product page, write a review
   - View and edit your reviews

## 📋 Database Models

### User Model

```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  date: Date (default: current date)
}
```

### Product Model

```javascript
{
  name: String (required),
  price: Number (required),
  description: String (required),
  tag: String (default: "general"),
  image: String,
  user: ObjectId (ref: User),
  date: Date (default: current date)
}
```

### Review Model

```javascript
{
  rating: Number,
  comment: String,
  product: ObjectId (ref: Product),
  user: ObjectId (ref: User),
  date: Date (default: current date)
}
```

### Notes Model

```javascript
{
  title: String (required),
  description: String,
  tag: String (default: "general"),
  user: ObjectId (ref: User),
  date: Date (default: current date)
}
```

## 🐛 Troubleshooting

### MongoDB Connection Error

- Verify MongoDB URI in `backend/db.js`
- Check if MongoDB Atlas cluster is active
- Ensure IP whitelist allows your connection

### CORS Error

- Ensure backend is running on `http://localhost:5000`
- Check CORS configuration in `backend/index.js`

### Port Already in Use

```bash
# Find and kill process using port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Session Issues

- Clear browser cookies
- Restart both servers
- Check session secret configuration

## 📚 Useful Commands

```bash
# Backend
cd backend
npm install          # Install dependencies
npx nodemon index.js # Run with auto-reload

# Frontend
cd ../ejs-project
npm install          # Install dependencies
node app.js          # Start server

# Check npm versions
npm -v
node -v

# Update packages
npm update

# Check for vulnerabilities
npm audit
```

## 🤝 Contributing

Feel free to fork, modify, and improve this project!

## 📄 License

ISC License - See package.json for details

## 👨‍💻 Author

Created as an e-commerce learning project

---

## 📞 Support

For issues or questions, please check the code comments or review the API documentation above.

**Happy Coding! 🚀**
