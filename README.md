# Techfest Server

The robust backend engine for the Techfest platform, built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Copy `.env.example` to `.env` and fill in the required values:
   ```bash
   cp .env.example .env
   ```

3. **Run in Development**:
   ```bash
   npm run start
   ```

4. **Run Tests**:
   ```bash
   npm test
   ```

## 🔐 Security Features
- **JWT + Refresh Tokens**: Dual-token system with `httpOnly` cookie storage for refresh tokens.
- **Helmet**: Secure HTTP headers for protection against common web vulnerabilities.
- **Mongo-Sanitize**: Protection against NoSQL Injection.
- **Rate Limiting**: Request limits on authentication and general API routes.
- **Winston Logger**: Structured logging for better error tracking and monitoring.
- **Graceful Shutdown**: Properly closes DB connections and server on termination.

## 🏗️ Architecture
- **Centralized Error Handling**: Global middleware for consistent API error responses.
- **Cluster Mode**: Utilizes multiple CPU cores for better performance.
- **Health Checks**: `/health` endpoint for monitoring system status.

## 📄 Documentation
See [API_DOCS.md](./API_DOCS.md) for detailed endpoint information.
