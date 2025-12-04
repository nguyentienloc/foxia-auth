# Hướng dẫn cấu hình Hydra OIDC

## Tổng quan

Tài liệu này hướng dẫn cấu hình Ory Hydra để làm OIDC/OAuth2 authorization server, tích hợp với Kratos làm identity provider.

## Cấu hình Hydra Server

### Environment Variables

Hydra server cần các biến môi trường sau:

```bash
# Database Configuration
DSN=postgres://user:password@host:port/database?sslmode=disable

# URLs
SERVE_PUBLIC_PORT=4444
SERVE_ADMIN_PORT=4445
SERVE_PUBLIC_HOST=0.0.0.0
SERVE_ADMIN_HOST=0.0.0.0

# Issuer URL (public URL của Hydra)
# Đây là URL mà client applications sẽ sử dụng
# Phải khớp với HYDRA_ISSUER_URL trong Backend
# Với setup hiện tại: https://oauth.foxia.vn (public link của Hydra)
ISSUER_URL=https://oauth.foxia.vn
# HOẶC dùng URLS_SELF_ISSUER (tương đương)
URLS_SELF_ISSUER=https://oauth.foxia.vn

# Secrets (phải generate, mỗi secret ít nhất 32 characters)
SECRETS_SYSTEM=$(openssl rand -hex 32)
SECRETS_COOKIE=$(openssl rand -hex 32)

# OIDC Configuration
STRATEGIES_ACCESS_TOKEN=jwt
STRATEGIES_SCOPE=exact

# Subject Identifier Strategy (sử dụng Kratos identity ID)
STRATEGIES_OIDC_SUBJECT_IDENTIFIERS_SUPPORTED_TYPES=public,pairwise
STRATEGIES_OIDC_SUBJECT_IDENTIFIERS_PAIRWISE_SALT=$(openssl rand -hex 32)

# Consent Strategy (auto cho Client Credentials Flow)
URLS_CONSENT=http://localhost:3000/oauth2/consent
URLS_LOGIN=http://localhost:3000/oauth2/login
URLS_ERROR=http://localhost:3000/oauth2/error
# URLS_SELF_ISSUER có thể dùng thay cho ISSUER_URL (chọn một trong hai)
# URLS_SELF_ISSUER=https://auth.foxia.vn

# Token Configuration
TTL_ACCESS_TOKEN=1h
TTL_REFRESH_TOKEN=720h
TTL_ID_TOKEN=1h
TTL_AUTH_CODE=10m

# CORS (nếu cần)
CORS_ENABLED=true
CORS_ALLOWED_ORIGINS=https://example.com,https://app.foxia.vn
```

### Generate Secrets

Để generate secrets an toàn:

```bash
# System secret (cho encryption)
openssl rand -hex 32

# Cookie secret
openssl rand -hex 32

# Pairwise salt (cho OIDC subject identifiers)
openssl rand -hex 32
```

### Cấu hình YAML (Recommended)

Nếu sử dụng file cấu hình YAML (khuyến nghị cho production):

```yaml
serve:
  public:
    port: 4444
    host: 0.0.0.0
  admin:
    port: 4445
    host: 0.0.0.0

dsn: postgres://user:password@host:port/database?sslmode=disable

urls:
  self:
    issuer: https://oauth.foxia.vn  # Public link của Hydra
  consent: https://auth.foxia.vn/oauth2/consent
  login: https://auth.foxia.vn/self-service/login/browser
  error: https://auth.foxia.vn/oauth2/error

strategies:
  access_token: jwt
  scope: exact
  oidc:
    subject_identifiers:
      supported_types:
        - public
        - pairwise
      pairwise:
        salt: <generate-random-32-char-hex>

secrets:
  system:
    - <generate-random-32-char-hex>
  cookie:
    - <generate-random-32-char-hex>

ttl:
  access_token: 1h
  refresh_token: 720h
  id_token: 1h
  auth_code: 10m

cors:
  enabled: true
  allowed_origins:
    - https://example.com
    - https://app.foxia.vn
```

## Cấu hình Backend NestJS

### Environment Variables

Thêm các biến sau vào `.env` của backend:

```bash
# Kratos URLs (Identity Provider)
KRATOS_PUBLIC_URL=https://auth.foxia.vn

# Hydra URLs (OAuth2/OIDC Authorization Server)
HYDRA_ADMIN_URL=https://admin-oauth.foxia.vn
HYDRA_PUBLIC_URL=https://oauth.foxia.vn

# Hydra Issuer URL (Public URL cho client applications)
# Đây là URL mà các ứng dụng bên ngoài sẽ sử dụng để:
# - Discovery OIDC configuration
# - Validate tokens
# - Làm base URL cho OAuth2 endpoints
# Với setup hiện tại: https://oauth.foxia.vn (public link của Hydra)
# PHẢI KHỚP với ISSUER_URL trong Hydra server
HYDRA_ISSUER_URL=https://oauth.foxia.vn

# Timeout (optional, default 10000ms)
HYDRA_TIMEOUT_MS=10000
```

### Giải thích các URLs

- **KRATOS_PUBLIC_URL**: URL của Kratos server (identity provider). Backend dùng để gọi Kratos API cho authentication flows.
- **HYDRA_ADMIN_URL**: URL internal của Hydra Admin API. Backend dùng để quản lý OAuth2 clients.
- **HYDRA_PUBLIC_URL**: URL internal của Hydra Public API. Backend dùng để gọi token/introspection endpoints.
- **HYDRA_ISSUER_URL**: Public issuer URL của Hydra. Đây là URL mà **client applications bên ngoài** sẽ thấy và sử dụng trong OIDC discovery và token validation. Thường được expose qua reverse proxy/load balancer.

**Lưu ý**: Trong production, `HYDRA_ISSUER_URL` thường là public domain (ví dụ: `https://auth.foxia.vn`), trong khi `HYDRA_PUBLIC_URL` có thể là internal URL (ví dụ: `http://hydra-public:4444`). Nếu Hydra được expose trực tiếp ra ngoài, thì `HYDRA_ISSUER_URL` có thể giống `HYDRA_PUBLIC_URL`.

### Database Setup

Đảm bảo Hydra database đã được migrate:

```bash
# Nếu chạy Hydra trong Docker
docker exec -it hydra hydra migrate sql postgres://user:password@host:port/database?sslmode=disable

# Hoặc nếu có Hydra CLI
hydra migrate sql postgres://user:password@host:port/database?sslmode=disable
```

## Tích hợp với Kratos

### Subject Identifier Mapping

Hydra sẽ sử dụng Kratos identity ID làm subject identifier:

- **Public**: Sử dụng trực tiếp Kratos identity ID
- **Pairwise**: Hash Kratos identity ID với salt để tạo unique subject per client

### Consent Strategy

Cho Client Credentials Flow, consent được tự động chấp nhận (không cần user interaction).

## Tạo OAuth2 Client

### Qua Backend API

```bash
POST /oauth2/clients
Content-Type: application/json

{
  "client_name": "My Application",
  "grant_types": ["client_credentials"],
  "scope": "read write",
  "token_endpoint_auth_method": "client_secret_basic"
}
```

### Qua Hydra Admin API

```bash
curl -X POST http://hydra-admin:4445/admin/clients \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "My Application",
    "grant_types": ["client_credentials"],
    "scope": "read write",
    "token_endpoint_auth_method": "client_secret_basic"
  }'
```

## Kiểm tra cấu hình

### 1. Kiểm tra Hydra health

```bash
curl http://hydra-admin:4445/health/ready
```

### 2. Kiểm tra OIDC Discovery

```bash
curl http://hydra-public:4444/.well-known/openid-configuration
```

### 3. Kiểm tra JWKS

```bash
curl http://hydra-public:4444/.well-known/jwks.json
```

## Troubleshooting

### Lỗi kết nối database

- Kiểm tra DSN connection string
- Đảm bảo database đã được migrate
- Kiểm tra network connectivity

### Lỗi secret không hợp lệ

- Secrets phải ít nhất 32 characters
- Sử dụng `openssl rand -hex 32` để generate
- Đảm bảo secrets được set đúng trong environment

### Lỗi CORS

- Kiểm tra `CORS_ALLOWED_ORIGINS`
- Đảm bảo origin được include trong allowed list

### Token không hợp lệ

- Kiểm tra token expiration
- Verify token với Hydra introspection endpoint
- Kiểm tra client credentials

## Cấu hình HYDRA_ISSUER_URL

Xem chi tiết trong [Hydra Issuer URL Configuration Guide](hydra-issuer-url-configuration.md)

## Cấu hình bằng file YAML

Xem chi tiết trong [Hydra YAML Configuration Guide](hydra-yml-configuration.md)

File cấu hình mẫu: `backend/config/hydra.config.yml`

## Tài liệu tham khảo

- [Hydra Documentation](https://www.ory.sh/docs/hydra/)
- [Hydra Configuration](https://www.ory.sh/docs/hydra/configuration)
- [OAuth2 Flows](https://www.ory.sh/docs/hydra/oauth2)

