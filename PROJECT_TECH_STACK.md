# MERN Ecommerce Project - Clean Tech Stack

This file gives a clean overview of the full project and what is used in backend and frontend.

## 1) Project Overview

This repository has 4 main apps:

- `backend`: Node.js + Express REST API, auth, products, orders, payments, reviews.
- `frontend`: Customer storefront (shopping UI).
- `admin`: Admin dashboard (manage products, sellers, orders, analytics).
- `seller`: Seller dashboard (seller product/order management and analytics).

Main flow:

- Frontend/Admin/Seller apps call backend APIs.
- Backend uses MongoDB for persistent data.
- Cloudinary stores product images.
- Redis caches some API/dashboard data.
- Razorpay/Stripe are used for payment flows.

## 2) Backend Stack (`backend`)

### Core Framework and Runtime

- `node` - JavaScript runtime for server.
- `express` - API server and route handling.
- `cors` - allows frontend origins to call backend.
- `dotenv` - loads environment variables.
- `morgan` - HTTP request logging middleware.

### Database and Models

- `mongoose` - MongoDB ODM (schemas/models and queries).

### Authentication and Security

- `jsonwebtoken` - JWT creation/verification for login sessions.
- `bcrypt` - password hashing and comparison.
- `bcryptjs` - included in dependencies (legacy/alternate bcrypt implementation).
- `validator` - validation helpers (for example, email checks).

### File/Image Uploads

- `multer` - multipart/form-data upload middleware.
- `cloudinary` - cloud image upload/storage/CDN.

### Caching / Performance

- `redis` - in-memory caching (example: product/admin dashboard cache keys).

### Email and Notifications

- `nodemailer` - SMTP email sending from backend.

### Payments

- `razorpay` - order creation and payment verification/refund handling.
- `stripe` - installed for Stripe payment integration support.

### API Docs

- `swagger-jsdoc` - generates OpenAPI spec from route docs.
- `swagger-ui-express` - serves API docs UI at `/api-docs`.

### Development Tooling

- `nodemon` - auto-restarts backend in development.

## 3) Customer Frontend Stack (`frontend`)

### Core

- `react` - UI library.
- `react-dom` - React DOM rendering.
- `react-router-dom` - SPA routing/navigation.
- `axios` - HTTP client to call backend APIs.
- `react-toastify` - toast notifications.
- `jwt-decode` - decode JWT token payload on client.
- `react-razorpay` - Razorpay checkout integration in frontend.

### Build / Styling / Lint

- `vite` - dev server and build tool.
- `@vitejs/plugin-react` - React plugin for Vite.
- `tailwindcss` - utility-first CSS framework.
- `postcss`, `autoprefixer` - CSS processing pipeline.
- `eslint` + React ESLint plugins - linting/code quality.

## 4) Admin Dashboard Stack (`admin`)

### Core

- `react`, `react-dom`
- `react-router-dom`
- `axios`
- `react-toastify`

### Charts / Analytics

- `chart.js`
- `react-chartjs-2`
- `recharts`

### Build / Styling / Lint

- `vite`, `@vitejs/plugin-react`
- `tailwindcss`, `postcss`, `autoprefixer`
- `eslint` + React ESLint plugins

## 5) Seller Dashboard Stack (`seller`)

Seller app uses the same style of stack as admin:

- `react`, `react-dom`
- `react-router-dom`
- `axios`
- `react-toastify`
- `recharts` (dashboard charts)
- `vite` + Tailwind + ESLint toolchain

## 6) Quick "What is used where?" (Requested examples)

- `redis` -> backend caching (`backend/config/redis.js`, controllers).
- `morgan` -> backend request logging (`backend/server.js`).
- `multer` -> backend file upload middleware (`backend/middleware/multer.js`).
- `cloudinary` -> backend image hosting/upload (`backend/config/cloudinary.js` + controllers).
- `jsonwebtoken` -> backend auth middleware/controllers + frontend token decode.
- `mongoose` -> backend DB connection/models.
- `nodemailer` -> backend email config and sending.
- `razorpay` / `react-razorpay` -> backend payment/order APIs + frontend checkout.
- `swagger-jsdoc` + `swagger-ui-express` -> backend API docs.

## 7) Architecture Summary (One Line)

MERN-based multi-panel ecommerce platform with one shared backend API and three React clients (customer, admin, seller), plus Redis cache, Cloudinary media, JWT auth, and Razorpay/Stripe-enabled payments.
