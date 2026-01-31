# ⚙️ Ambiora Server

The robust, secure, and scalable backend engine for **Ambiora 2026'**. Optimized for high-concurrency event registration and administrative management.

## 🔐 Security Architecture

### Authentication & Authorization
- **Dual-Token System**: Implements **JWT Access Tokens** (short-lived) and **Refresh Tokens** (long-lived) for a balance of security and UX.
- **httpOnly Cookies**: Refresh tokens are stored in secure, `httpOnly` cookies, preventing XSS-based token theft.
- **RBAC (Role-Based Access Control)**:
    - **Superior Admin**: Global access to all data, transaction verification, and event creation.
    - **Event Admin**: Restricted access to assigned events only.
    - **User**: Standard permissions for registration and profile management.

### Server Hardening
- **Helmet.js**: Configures various HTTP headers to protect against common attacks (XSS, Clickjacking, etc.).
- **Mongo-Sanitize**: Prevents NoSQL injection attacks by stripping `$` and `.` from user inputs.
- **Rate Limiting**: 
    - Strict limits on `/api/auth/` routes to prevent brute-force attacks.
    - General limits on `/api/` to prevent DDoS and API abuse.
- **Express Trust Proxy**: Configured for seamless deployment behind proxies like Render and Cloudflare.

## ⚡ Performance Features
- **Server-Side Pagination**: Efficiently handles massive datasets (e.g., thousands of registrations) by serving data in limit/skip chunks.
- **Node.js Cluster Mode**: Utilizes multiple CPU cores to maximize throughput and reliability.
- **Database Indexing**: Optimized MongoDB schemas with indices on frequently queried fields like `email`, `username`, and `eventId`.
- **Response Compression**: Uses Gzip compression to reduce payload sizes and speed up response times.

## 🏗️ Technical Specifications
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Logging**: Structured Winston Logger (Console + File logging)
- **Health Monitoring**: Integrated `/health` endpoint for uptime Tracking.

## 📦 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Copy `.env.example` to `.env` and configure your credentials:
   ```bash
   PORT=5001
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_access_token_secret
   JWT_REFRESH_SECRET=your_refresh_token_secret
   ADMIN_UPI_ID=your_payment_upi_id
   CLIENT_URL=http://localhost:5173
   ```

3. **Development Mode**:
   ```bash
   npm start
   ```

4. **Run Tests**:
   ```bash
   npm test
   ```

## 📄 Documentation
For a full breakdown of every API endpoint, request body, and response format, see:
👉 [API Documentation](./API_DOCS.md)

## 🔗 Project Links
- **GitHub Repository**: [irongopher75/Techfest_Server](https://github.com/irongopher75/Techfest_Server)
- **Live Website**: [techfestmpstme](https://techfestmpstme.netlify.app)
- **Live API Endpoint**: [ambiora-server.onrender.com](https://ambiora-server.onrender.com) (Verification Required)

---
*Architected for the Future by Vishnu Panicker*
