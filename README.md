# StyleWave MERN Ecommerce

A full-stack multi-vendor ecommerce platform built with the MERN stack, Socket.IO, Redis, and Razorpay. It includes separate apps for customers, admins, and sellers, all powered by one shared backend API.

![MERN Stack](https://img.shields.io/badge/MERN-Stack-green)
![Node.js](https://img.shields.io/badge/Node.js-Backend-brightgreen)
![React](https://img.shields.io/badge/React-Frontend-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)
![Redis](https://img.shields.io/badge/Redis-Caching-red)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-black)
![Razorpay](https://img.shields.io/badge/Razorpay-Payments-blue)

---

## Features

### Customer

- Browse, search, filter, and sort products
- Add products to cart and manage quantities
- Place orders with Cash on Delivery or Razorpay
- View order history and cancel eligible orders
- Submit reviews after purchase
- Use an AI shopping assistant

### Admin

- Add and manage platform products
- Approve, reject, suspend, or restore seller products
- Create and manage sellers
- View platform orders, seller orders, all orders, and dashboard analytics
- Moderate product reviews
- Use an AI operations assistant

### Seller

- Add, edit, and delete seller products
- Submit products for admin approval
- View product reviews and manage orders
- Monitor seller dashboard metrics
- Use an AI seller insights assistant

### Platform

- Role-based authentication: Clerk for customers, JWT for admins and sellers
- Stock reservation flow to reduce overselling during checkout
- Socket.IO realtime updates for products and orders
- Redis caching for dashboard and catalog data
- Cloudinary image uploads
- Razorpay payment verification and refund support
- Cron jobs for expired reservations, low-stock alerts, and best-seller updates
- Swagger / OpenAPI documentation
- API rate limiting

---

## Tech Stack

### Frontend

- React + Vite
- Tailwind CSS
- React Router
- Axios
- Recharts
- React Toastify

### Backend

- Node.js + Express
- MongoDB + Mongoose
- Clerk + JWT + bcrypt
- Redis + Socket.IO
- Cloudinary + Multer
- Razorpay
- Nodemailer
- Swagger
- node-cron

---

## Installation And Setup

### Prerequisites

- Node.js 18 or higher
- MongoDB database
- Cloudinary account
- Clerk account
- Razorpay account
- Redis instance

### 1. Clone Repository

```bash
git clone https://github.com/megha445/stylewave-mern-ecommerce.git
cd stylewave-mern-ecommerce
```

### 2. Install Dependencies

Run these from the project root:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ../admin && npm install
cd ../seller && npm install
```

### 3. Create Environment Files

Copy the example files and fill in your values:

```text
backend/.env.example  -> backend/.env
frontend/.env.example -> frontend/.env
admin/.env.example    -> admin/.env
seller/.env.example   -> seller/.env
```

Update values for MongoDB, Clerk, Cloudinary, email, Razorpay, Redis, and AI provider keys.

### 4. Start The Backend

```bash
cd backend
npm run server
```

### 5. Start The React Apps

Open separate terminals for each:

```bash
cd frontend && npm run dev
```

```bash
cd admin && npm run dev
```

```bash
cd seller && npm run dev
```

---

## Local URLs

| Service | URL |
| --- | --- |
| Customer frontend | `http://localhost:5173` |
| Admin dashboard | `http://localhost:5174` |
| Seller dashboard | `http://localhost:5175` |
| Backend API | `http://localhost:4000` |
| Swagger docs | `http://localhost:4000/api-docs` |

---

## Docker Setup

The project includes Dockerfiles for the backend, customer app, admin app, and seller app, plus a root `docker-compose.yml` for local multi-service setup.

To build and run the full stack with MongoDB and Redis:

```bash
docker compose up --build
```

Docker local URLs:

| Service | URL |
| --- | --- |
| Customer frontend | `http://localhost:5173` |
| Admin dashboard | `http://localhost:5174` |
| Seller dashboard | `http://localhost:5175` |
| Backend API | `http://localhost:4000` |
| MongoDB | `mongodb://localhost:27017` |
| Redis | `redis://localhost:6379` |

For Clerk, Cloudinary, Razorpay, email, and AI features, pass the required environment variables through your shell or a local compose-compatible `.env` file.

---

## Default Admin Account

To create a local default admin:

```bash
cd backend
npm run create-admin
```

Default credentials:

```text
Email: admin@stylewave.com
Password: Admin@123456
```

Change the password before using the project in any real environment.

---

## How To Use

1. **Customer**: sign in with Clerk, browse products, add items to cart, and checkout with COD or Razorpay
2. **Seller**: log in, add products, submit them for approval, and manage orders and reviews
3. **Admin**: log in, approve or reject seller products, manage sellers, and monitor platform analytics
4. **API docs**: visit `http://localhost:4000/api-docs` for Swagger documentation


---

## Main API Endpoints

### User And Auth

- `POST /api/user/admin` - Admin login
- `POST /api/user/seller` - Seller login
- `POST /api/user/forgot-password` - User password recovery
- `GET /api/user/cart` - Get customer cart

### Products

- `GET /api/product/list` - List products
- `GET /api/product/search` - Search products
- `POST /api/product/add` - Add product
- `GET /api/product/pending` - Get pending seller products

### Orders

- `POST /api/orders` - Create COD order
- `POST /api/orders/reserve` - Reserve stock during checkout
- `GET /api/orders/myorders` - Get customer orders


### Sellers

- `POST /api/seller/add` - Create seller
- `GET /api/seller/list` - List sellers
- `GET /api/seller/product/list` - Get seller products

### Reviews

- `GET /api/reviews/product/:productId` - Get public product reviews
- `POST /api/reviews/add` - Add review
- `GET /api/reviews/admin/all` - Get all reviews for admin

### Payments

- `GET /api/payment/razorpay/key` - Get Razorpay public key
- `POST /api/payment/razorpay/create-order` - Create Razorpay order
- `POST /api/payment/razorpay/verify` - Verify Razorpay payment and create order

### AI Assistants

- `POST /api/ai/user/shopping` - Customer shopping assistant
- `POST /api/ai/seller/insights` - Seller insights assistant
- `POST /api/ai/admin/insights` - Admin operations assistant

Full documentation is available at `http://localhost:4000/api-docs`.

---

## CI/CD

The repository includes a GitHub Actions workflow at `.github/workflows/ci.yml`.

On every push or pull request to `main`, it runs:

- backend dependency install and JavaScript syntax checks
- customer frontend build
- admin dashboard build
- seller dashboard build
- Docker image build checks for all four apps

This verifies that the project can be installed, built, and containerized before changes are merged or published.

---

## Environment Variables

### Backend

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | Backend server port | `4000` |
| `TRUST_PROXY` | Enable proxy trust in production | `false` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/stylewave` |
| `JWT_SECRET` | Secret used for JWT signing | `change_me_in_real_use` |
| `CLERK_SECRET_KEY` | Clerk backend secret | `sk_test_...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your_cloudinary_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `your_cloudinary_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your_cloudinary_api_secret` |
| `EMAIL_USER` | Email account used for sending mail | `your_email@gmail.com` |
| `EMAIL_PASSWORD` | Email app password | `your_email_app_password` |
| `EMAIL_FROM_NAME` | Sender display name | `Stylewave` |
| `EMAIL_REPLY_TO` | Reply-to address | `your_support_email@gmail.com` |
| `RAZORPAY_KEY_ID` | Razorpay key ID | `your_razorpay_key_id` |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret | `your_razorpay_key_secret` |
| `FRONTEND_URL` | Customer app URL | `http://localhost:5173` |
| `ADMIN_DASHBOARD_URL` | Admin app URL | `http://localhost:5174` |
| `SELLER_DASHBOARD_URL` | Seller app URL | `http://localhost:5175` |
| `SOCKET_CORS_ORIGIN` | Allowed Socket.IO origins | `http://localhost:5173,http://localhost:5174,http://localhost:5175` |
| `REDIS_URL` | Redis connection URL | `redis://127.0.0.1:6379` |
| `AI_PROVIDER` | AI provider selector | `groq` |
| `GROQ_API_KEY` | Groq API key | `your_groq_key_here` |
| `AI_MODEL` | AI model name | `llama-3.1-8b-instant` |

### Frontend Apps

| App | Variable | Example |
| --- | --- | --- |
| `frontend` | `VITE_BACKEND_URL` | `http://localhost:4000` |
| `frontend` | `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_...` |
| `admin` | `VITE_BACKEND_URL` | `http://localhost:4000` |
| `seller` | `VITE_BACKEND_URL` | `http://localhost:4000` |

---

## Notable Backend Workflows

### Checkout And Inventory

Stock is reserved before order creation. If checkout is not completed in time, a cron job automatically releases expired reservations to reduce overselling.

### Realtime Updates

Socket.IO broadcasts product and order changes so dashboards and catalog views can refresh without manual reloads.

### Best-Seller Updates

A scheduled job calculates top products using recent sales, ratings, review count, and recency, then updates best-seller flags automatically.

---

## Future Improvements

- Add automated tests for backend APIs and frontend flows
- Add production deployment workflows
- Replace temporary-password email flows with tokenized reset links
- Move auth tokens from localStorage to secure cookie-based handling
- Add richer deployment documentation and screenshots

---

## Acknowledgments

- [Clerk](https://clerk.com) for customer authentication
- [Razorpay](https://razorpay.com) for payment processing
- [Socket.IO](https://socket.io) for realtime communication
- [MongoDB](https://www.mongodb.com) for the database
- [Cloudinary](https://cloudinary.com) for image hosting
- [Redis](https://redis.io) for caching
- [React](https://react.dev) for the UI library
- [Tailwind CSS](https://tailwindcss.com) for styling

---

## Author

**Megha shyam**

- GitHub: [megha445](https://github.com/megha445)
- Email: vattamvenkatasaimeghashyamredd@gmail.com

---

If you found this project helpful, please give it a star.
