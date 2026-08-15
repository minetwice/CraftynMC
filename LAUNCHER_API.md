# FearLauncher Network - Mobile Launcher Integration API (v1)

This documentation provides precise information on the `v1` REST API used by custom mobile/Android Minecraft Java launchers to sync user accounts, retrieve profiles, and fetch custom skin files from the FearLauncher website backend.

---

## 1. General Constraints & Security

- **Base URL**: `https://fearlauncher.net` (or local development `http://localhost:3000`)
- **API Prefix**: `/api/v1`
- **Protocol**: HTTPS only (for secure token transmission)
- **Token Format**: JWT (JSON Web Token) passed in headers
- **Auth Header Format**: `Authorization: Bearer {accessToken}`
- **Skin Image Format**: Standard Minecraft PNG skins (64x64 or 64x32 dimensions).
- **Authentication Scope**: Independent custom website credentials. We strictly **never** store or request Minecraft/Microsoft account passwords.

---

## 2. API Success & Error Protocols

All REST responses follow a standardized payload structure.

### SUCCESS Response Format
```json
{
  "success": true,
  "data": {
    "key": "value"
  }
}
```

### ERROR Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable reason or validation error message"
  }
}
```

---

## 3. Endpoints Documentation

### 3.1. Register Account
Creates a new website player account with a stable UUID for game mapping.

- **Route**: `POST /api/v1/auth/register`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "username": "SteveMaster",
    "email": "steve@example.com",
    "password": "strongPassword123"
  }
  ```
- **Response Example**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "64d4bca0d3f23a0172e293a1",
        "uuid": "8667ba71-b85a-4004-af54-457a9734eed7",
        "username": "SteveMaster",
        "email": "steve@example.com"
      }
    }
  }
  ```

---

### 3.2. Login Account & Fetch Profile
Authenticates credentials and returns a short-lived access token, refresh token, and detailed player profile with skin info.

- **Route**: `POST /api/v1/auth/login`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "username": "steve@example.com",
    "password": "strongPassword123"
  }
  ```
- **Response Example**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "7c10d9e84b8af...",
      "expiresIn": 3600,
      "user": {
        "id": "64d4bca0d3f23a0172e293a1",
        "uuid": "8667ba71-b85a-4004-af54-457a9734eed7",
        "username": "SteveMaster",
        "displayName": "SteveMaster",
        "skin": {
          "exists": true,
          "updatedAt": "2026-08-13T12:00:00.000Z",
          "variant": "classic",
          "url": "/api/v1/skins/8667ba71-b85a-4004-af54-457a9734eed7.png"
        }
      }
    }
  }
  ```

---

### 3.3. Refresh Access Token
Obtains a fresh Access Token using a valid Refresh Token (implements secure refresh token rotation).

- **Route**: `POST /api/v1/auth/refresh`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "refreshToken": "7c10d9e84b8af..."
  }
  ```
- **Response Example**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "ab29f0ce8cd4...",
      "expiresIn": 3600
    }
  }
  ```

---

### 3.4. Get Current User Profile (me)
Fetches profile details using the Access Token.

- **Route**: `GET /api/v1/auth/me`
- **Headers**:
  - `Authorization: Bearer {accessToken}`
- **Response Example**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "64d4bca0d3f23a0172e293a1",
        "uuid": "8667ba71-b85a-4004-af54-457a9734eed7",
        "username": "SteveMaster",
        "displayName": "SteveMaster",
        "skin": {
          "exists": true,
          "updatedAt": "2026-08-13T12:00:00.000Z",
          "variant": "classic",
          "url": "/api/v1/skins/8667ba71-b85a-4004-af54-457a9734eed7.png"
        }
      }
    }
  }
  ```

---

### 3.5. Upload Custom Skin (PUT)
Allows direct skin upload using multipart/form-data. Overwrites any existing skin files and logs updating timestamps.

- **Route**: `PUT /api/v1/users/me/skin`
- **Headers**:
  - `Authorization: Bearer {accessToken}`
- **Request Body (multipart/form-data)**:
  - `skinFile`: raw binary PNG image (max 2MB, 64x64 or 64x32 dimensions)
  - `variant`: `"classic"` or `"slim"`
- **Response Example**:
  ```json
  {
    "success": true,
    "data": {
      "skin": {
        "exists": true,
        "updatedAt": "2026-08-13T13:45:00.000Z",
        "variant": "slim",
        "url": "/api/v1/skins/8667ba71-b85a-4004-af54-457a9734eed7.png"
      }
    }
  }
  ```

---

### 3.6. Download Custom Skin PNG (GET)
Serves raw binary skin texture files with optimized caching controls.

- **Route**: `GET /api/v1/skins/{uuid}.png`
- **Headers**:
  - Optional `Authorization` if private, public allows open download.
- **Caching**:
  - Includes `ETag` and `Last-Modified` headers.
  - Supports `304 Not Modified` on client re-request.
  - `Cache-Control`: `public, max-age=86400`
- **Content-Type**: `image/png`

---

### 3.7. Get Launcher Config
Supplies system details and endpoint parameters directly to mobile clients.

- **Route**: `GET /api/v1/launcher/config`
- **Response Example**:
  ```json
  {
    "success": true,
    "data": {
      "baseUrl": "https://fearlauncher.net",
      "apiVersion": "v1",
      "skinSystem": "custom",
      "launcherSkinMode": "custom_skin_loader_or_authlib_injector",
      "supportEmail": "support@fearlauncher.net"
    }
  }
  ```

---

## 4. Error Code Summary

| Error Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `UNAUTHORIZED` | 401 | Missing or invalid auth headers |
| `INVALID_TOKEN` | 401 | Access token expired or structurally invalid |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token expired, revoked, or rotated |
| `USER_EXISTS` | 409 | Username or Email has already been claimed |
| `BANNED_USER` | 403 | Authenticated account is locked by administrators |
| `INVALID_MIMETYPE` | 400 | Skin upload file type is not image/png |
| `MISSING_FILE` | 400 | No skin file included in request |
| `INTERNAL_ERROR` | 500 | Unhandled database or backend exception |

---

## 5. Test Plan (cURL Integration Verification)

Copy and execute these curls in terminal to verify integration:

### Step A: Fetch Mobile Configuration
```bash
curl -i http://localhost:3000/api/v1/launcher/config
```

### Step B: Register New Account
```bash
curl -i -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"MascotRunner", "email":"mascot@fearlauncher.net", "password":"password123"}'
```

### Step C: Log in & Get Token
```bash
curl -i -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"mascot@fearlauncher.net", "password":"password123"}'
```
