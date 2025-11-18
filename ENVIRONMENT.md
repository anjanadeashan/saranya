# Environment Variables Configuration

This document describes the environment variables used in the Saranya International frontend application.

## Environment Files

- `.env` - Default environment variables for all environments
- `.env.development` - Development-specific overrides
- `.env.production` - Production-specific overrides  
- `.env.example` - Template file with example values

## Available Environment Variables

### API Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `REACT_APP_API_URL` | string | `https://api.saranyainternational.online` | Backend API base URL |
| `REACT_APP_API_TIMEOUT` | number | `10000` | API request timeout in milliseconds |

### Application Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `REACT_APP_NAME` | string | `Saranya International` | Application display name |
| `REACT_APP_VERSION` | string | `1.0.0` | Application version |

### Authentication

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `REACT_APP_TOKEN_STORAGE_KEY` | string | `token` | Local storage key for auth token |
| `REACT_APP_SESSION_TIMEOUT` | number | `24` | Session timeout in hours |

### Feature Flags

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `REACT_APP_ENABLE_DEBUG_LOGGING` | boolean | `false` | Enable debug console logging |
| `REACT_APP_ENABLE_ANALYTICS` | boolean | `false` | Enable analytics tracking |

### UI Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `REACT_APP_TOAST_AUTO_CLOSE` | number | `3000` | Toast notification auto-close time (ms) |
| `REACT_APP_PAGINATION_SIZE` | number | `10` | Default pagination page size |

## Setup Instructions

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env` according to your environment needs.

3. Restart the development server after changing environment variables:
   ```bash
   npm start
   ```

## Environment-Specific Configuration

### Development
- Debug logging is enabled
- Extended timeout for slower development servers
- Analytics disabled

### Production
- Debug logging disabled
- Optimized timeout values
- Analytics enabled (if configured)

## Security Notes

- Never commit sensitive values in `.env` files
- Use `.env.local` for local overrides that shouldn't be committed
- All environment variables must be prefixed with `REACT_APP_` to be accessible in the frontend

## Backend Integration

The application is configured to connect to:
- **Production API**: `https://api.saranyainternational.online`

Make sure the backend server is running and accessible at the configured URL.