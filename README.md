# StyleWave MERN E-Commerce Platform

StyleWave is a full-stack MERN e-commerce platform with separate applications for customers, sellers, and admins. It supports product management, seller approval workflow, orders, Razorpay payments, reviews, real-time updates, dashboards, Cloudinary image uploads, Redis caching, email notifications, and Groq-powered AI assistants.

## Project Highlights

- Customer storefront with product search, cart, checkout, orders, reviews, profile, and AI shopping helper
- Seller dashboard with product upload, product management, orders, review insights, real-time updates, and AI growth helper
- Admin dashboard with product approval, seller management, orders, reviews, analytics, and AI operations helper
- JWT authentication for user, seller, and admin roles
- Cloudinary image upload support
- Razorpay payment integration
- Socket.IO real-time updates for products, orders, and reviews
- Redis caching for product and dashboard data
- Groq AI integration using `llama-3.1-8b-instant`

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Axios, Socket.IO Client
- Backend: Node.js, Express.js, MongoDB, Mongoose, Socket.IO
- Cache: Redis
- Payments: Razorpay
- Media: Cloudinary
- Email: Nodemailer
- AI: Groq API
- Deployment: Vercel for React apps, Render/Railway for backend, MongoDB Atlas, Redis Cloud/Upstash

## Folder Structure

```text
MERN-Ecommerce-main/
  backend/   Express API, MongoDB models, controllers, routes, sockets, cron jobs
  frontend/  Customer shopping app
  admin/     Admin dashboard
  seller/    Seller dashboard
```

## Local Setup

Install dependencies in each app:

```powershell
cd backend
npm install

cd ../frontend
npm install

cd ../admin
npm install

cd ../seller
npm install
```

## Environment Variables

Create `backend/.env`:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/mern_ecommerce
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

FRONTEND_URL=http://localhost:5173
SELLER_DASHBOARD_URL=http://localhost:5175

REDIS_URL=redis://127.0.0.1:6379

AI_PROVIDER=groq
GROQ_API_KEY=your_groq_key_here
AI_MODEL=llama-3.1-8b-instant
```

Create `frontend/.env`, `admin/.env`, and `seller/.env`:

```env
VITE_BACKEND_URL=http://localhost:4000
```

## Redis Setup

Redis is used for caching product lists and dashboard data. The project now reads Redis from:

```env
REDIS_URL=redis://127.0.0.1:6379
```

### Local Redis

If you are using Ubuntu/WSL locally:

```bash
sudo apt update
sudo apt install redis-server
sudo service redis-server start
redis-cli ping
```

Expected output:

```text
PONG
```

### Redis During Deployment

Do not use `redis://127.0.0.1:6379` on Render/Railway unless Redis is installed inside the same server. For normal deployment, use a managed Redis provider.

Recommended options:

- Upstash Redis: https://upstash.com
- Redis Cloud: https://redis.com/try-free
- Railway Redis plugin if backend is deployed on Railway

After creating Redis, copy the provider connection URL and set it as:

```env
REDIS_URL=rediss://default:password@host:port
```

If Redis is not configured correctly, the app will still run, but caching will be disabled.

## Groq AI Setup

Create a Groq API key here:

https://console.groq.com/keys

Then set:

```env
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_key_here
AI_MODEL=llama-3.1-8b-instant
```

AI assistants are available in:

- Customer profile page
- Seller dashboard
- Admin dashboard

## Run Locally

Start backend:

```powershell
cd backend
node server.js
```

Start customer app:

```powershell
cd frontend
.\node_modules\.bin\vite.cmd
```

Start admin app:

```powershell
cd admin
.\node_modules\.bin\vite.cmd
```

Start seller app:

```powershell
cd seller
.\node_modules\.bin\vite.cmd
```

Local URLs:

- Customer: http://localhost:5173
- Admin: http://localhost:5174
- Seller: http://localhost:5175
- Backend: http://localhost:4000

## Deployment Plan

### 1. Database

Create a MongoDB Atlas cluster and set:

```env
MONGO_URI=your_mongodb_atlas_connection_string
```

### 2. Backend

Deploy `backend/` to Render or Railway.

Build command:

```bash
npm install
```

Start command:

```bash
node server.js
```

Set all backend environment variables in the hosting dashboard.

### 3. Customer App

Deploy `frontend/` to Vercel.

Set:

```env
VITE_BACKEND_URL=https://your-backend-url
```

### 4. Admin App

Deploy `admin/` to Vercel.

Set:

```env
VITE_BACKEND_URL=https://your-backend-url
```

### 5. Seller App

Deploy `seller/` to Vercel.

Set:

```env
VITE_BACKEND_URL=https://your-backend-url
```

### 6. Backend URLs

After deployment, update backend env values:

```env
FRONTEND_URL=https://your-customer-app.vercel.app
SELLER_DASHBOARD_URL=https://your-seller-app.vercel.app
```

## Important Security Notes

- Never commit real `.env` files to GitHub.
- Rotate any keys that were exposed during development.
- Use app passwords for Gmail, not your main email password.
- Use test Razorpay keys for demo unless going live.
- Keep admin credentials private.

## Suggested Demo Flow

1. Login as admin and show dashboard.
2. Add or approve a seller product.
3. Login as seller and show product/order/review management.
4. Login as customer and place an order.
5. Show real-time order/product updates.
6. Add a product review and show seller review update.
7. Ask the AI assistant in customer, seller, and admin panels.

## Interview Explanation

This project is a multi-role MERN e-commerce platform. Customers can browse, order, pay, and review products. Sellers can upload products and manage seller-side orders. Admins approve seller products, manage sellers, and monitor platform activity. Real-time updates are handled with Socket.IO, caching is handled with Redis, images are stored on Cloudinary, payments use Razorpay, and Groq AI assistants provide shopping, seller, and admin insights.
