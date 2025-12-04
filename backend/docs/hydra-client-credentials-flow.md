# Hướng dẫn sử dụng Client Credentials Flow

## Tổng quan

Client Credentials Flow là OAuth2 flow phù hợp cho server-to-server authentication, không cần user interaction.

## Luồng hoạt động

```
Client Application
    |
    | 1. Request Token
    v
POST /oauth2/token
    |
    | 2. Validate Credentials
    v
Hydra Server
    |
    | 3. Issue Token
    v
Client Application
    |
    | 4. Use Token
    v
Protected Resource
```

## Tạo OAuth2 Client

### Qua Backend API

```bash
curl -X POST http://localhost:3000/oauth2/clients \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "My Service",
    "grant_types": ["client_credentials"],
    "scope": "read write",
    "token_endpoint_auth_method": "client_secret_basic"
  }'
```

Response:
```json
{
  "client_id": "abc123...",
  "client_secret": "xyz789...",
  "client_name": "My Service",
  "grant_types": ["client_credentials"],
  "scope": "read write"
}
```

**Lưu ý**: Lưu `client_id` và `client_secret` an toàn, không commit vào git.

## Lấy Access Token

### Request

```bash
curl -X POST http://localhost:3000/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=abc123..." \
  -d "client_secret=xyz789..." \
  -d "scope=read write"
```

### Response

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read write"
}
```

## Sử dụng Access Token

### Ví dụ với cURL

```bash
curl -X GET http://localhost:3000/api/protected \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Ví dụ với JavaScript/TypeScript

```typescript
// Lấy token
const tokenResponse = await fetch('http://localhost:3000/oauth2/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: 'abc123...',
    client_secret: 'xyz789...',
    scope: 'read write',
  }),
});

const { access_token } = await tokenResponse.json();

// Sử dụng token
const apiResponse = await fetch('http://localhost:3000/api/protected', {
  headers: {
    'Authorization': `Bearer ${access_token}`,
  },
});
```

### Ví dụ với Python

```python
import requests

# Lấy token
token_response = requests.post(
    'http://localhost:3000/oauth2/token',
    data={
        'grant_type': 'client_credentials',
        'client_id': 'abc123...',
        'client_secret': 'xyz789...',
        'scope': 'read write',
    },
    headers={'Content-Type': 'application/x-www-form-urlencoded'},
)

access_token = token_response.json()['access_token']

# Sử dụng token
api_response = requests.get(
    'http://localhost:3000/api/protected',
    headers={'Authorization': f'Bearer {access_token}'},
)
```

## Bảo vệ API Endpoints

### Sử dụng OAuth2TokenGuard

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { OAuth2TokenGuard } from 'core/auth/guards/oauth2-token.guard';
import { OAuth2Client } from 'core/auth/decorators/oauth2-client.decorator';

@Controller('api')
export class ApiController {
  @Get('protected')
  @UseGuards(OAuth2TokenGuard)
  async protectedRoute(@OAuth2Client() client: any) {
    return {
      message: 'This is a protected route',
      clientId: client.clientId,
      scope: client.scope,
    };
  }
}
```

### Optional Guard (không bắt buộc token)

```typescript
import { SetMetadata } from '@nestjs/common';

const OPTIONAL = 'optional';

@Get('optional-protected')
@SetMetadata(OPTIONAL, true)
@UseGuards(OAuth2TokenGuard)
async optionalProtectedRoute(@OAuth2Client() client?: any) {
  if (client) {
    return { message: 'Authenticated', clientId: client.clientId };
  }
  return { message: 'Public access' };
}
```

## Introspect Token

Kiểm tra token có hợp lệ và lấy thông tin:

```bash
curl -X POST http://localhost:3000/oauth2/introspect \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Response:
```json
{
  "active": true,
  "client_id": "abc123...",
  "scope": "read write",
  "exp": 1234567890,
  "iat": 1234564290
}
```

## Best Practices

### 1. Lưu trữ Credentials an toàn

- Không commit `client_id` và `client_secret` vào git
- Sử dụng environment variables hoặc secret management
- Rotate secrets định kỳ

### 2. Cache Tokens

- Tokens có expiration time (thường 1 giờ)
- Cache token trong memory hoặc Redis
- Refresh token trước khi expire

### 3. Error Handling

```typescript
try {
  const token = await getAccessToken();
  // Use token
} catch (error) {
  if (error.status === 401) {
    // Invalid credentials, check client_id/secret
  } else if (error.status === 400) {
    // Invalid request, check parameters
  }
  // Retry or log error
}
```

### 4. Scope Management

- Chỉ request scopes cần thiết
- Validate scopes ở protected endpoints
- Document scopes cho từng client

### 5. Token Validation

- Luôn validate token ở server side
- Sử dụng Hydra introspection endpoint
- Kiểm tra token expiration

## Troubleshooting

### Lỗi "Invalid client credentials"

- Kiểm tra `client_id` và `client_secret` đúng
- Đảm bảo client tồn tại trong Hydra
- Verify client có grant type `client_credentials`

### Lỗi "Invalid grant_type"

- Đảm bảo `grant_type=client_credentials`
- Kiểm tra client có grant type này trong allowed list

### Lỗi "Invalid scope"

- Kiểm tra scope được request có trong client allowed scopes
- Verify scope format đúng (space-separated)

### Token expired

- Token có expiration time
- Implement token refresh logic
- Cache và reuse token khi còn valid

## Ví dụ hoàn chỉnh

Xem file `examples/client-credentials-example.ts` trong repository để có ví dụ implementation đầy đủ.

