# RoastRepo Backend

A Node.js Express backend for the GitHub roasting application that fetches GitHub user data and generates humorous roasts using LLM APIs.

## Features

- ✅ GitHub API integration with proper authentication
- ✅ Rate limiting and caching for optimal performance
- ✅ LLM integration (Groq) for generating creative roasts
- ✅ RESTful API endpoints
- ✅ Security middleware (CORS, Helmet)
- ✅ Environment-based configuration

## Authentication Options for GitHub API

### 1. GitHub App (Recommended for Production)

- **Rate Limits**: 5,000 requests/hour per installation
- **Security**: App-level authentication, more secure
- **Setup**: Create GitHub App in your GitHub account

### 2. OAuth App

- **Rate Limits**: 5,000 requests/hour per authenticated user
- **User Experience**: Users authorize via GitHub OAuth
- **Setup**: Create OAuth App in GitHub Developer Settings

### 3. Personal Access Token (Development Only)

- **Rate Limits**: 60 requests/hour (unauthenticated), 5,000 (authenticated)
- **Security**: Less secure for production use
- **Setup**: Generate token in GitHub Settings > Developer settings

## Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables** (create `.env` file):

   ```
   PORT=3000
   NODE_ENV=development

   # GitHub Authentication (choose one)
   GITHUB_APP_ID=your_app_id
   GITHUB_APP_PRIVATE_KEY=your_private_key
   # OR
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   # OR
   GITHUB_TOKEN=your_personal_access_token

   # LLM API
   GROQ_API_KEY=your_groq_api_key
   ```

3. **Run the server**:
   ```bash
   npm run dev
   ```

## API Endpoints

- `GET /api/roast/:username` - Generate roast for GitHub user
- `GET /api/user/:username` - Get GitHub user profile data
- `GET /api/health` - Health check endpoint

## Implementation Steps

### Step 1: GitHub API Setup

1. Choose authentication method (GitHub App recommended)
2. Register your application with GitHub
3. Configure environment variables

### Step 2: LLM Integration

1. Sign up for Groq API (free tier available)
2. Get API key and add to environment
3. Configure roast generation prompts

### Step 3: Deploy

- Supports deployment to Vercel, Railway, Render, or any Node.js hosting

## Security Features

- Rate limiting (100 requests per 15 minutes per IP)
- CORS protection
- Input validation and sanitization
- API key protection via environment variables

## Architecture

```
src/
├── controllers/     # Request handlers
├── services/        # Business logic (GitHub API, LLM)
├── middleware/      # Custom middleware (auth, validation)
├── routes/          # API route definitions
├── utils/           # Helper functions
└── config/          # Configuration files
```
