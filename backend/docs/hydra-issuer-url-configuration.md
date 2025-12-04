# Hướng dẫn cấu hình HYDRA_ISSUER_URL

## Tổng quan

`HYDRA_ISSUER_URL` là public URL mà client applications sẽ sử dụng để:
- Discovery OIDC configuration
- Validate tokens
- Làm base URL cho các OAuth2 endpoints

## Ví dụ thực tế

Với setup hiện tại:
- `https://auth.foxia.vn` - Public link của Kratos (backend NestJS gọi)
- `https://oauth.foxia.vn` - Public link của Hydra (client applications sử dụng)
- `https://admin-oauth.foxia.vn` - Admin link của Hydra

**Vậy `HYDRA_ISSUER_URL` = `https://oauth.foxia.vn`**

## Cấu hình ở 2 nơi

### 1. Cấu hình trong Hydra Server

Hydra server cần biết issuer URL của chính nó. Cấu hình qua environment variable:

```bash
# Trong Hydra server environment
# Đây là public URL của Hydra (không phải Kratos)
ISSUER_URL=https://oauth.foxia.vn
# HOẶC
URLS_SELF_ISSUER=https://oauth.foxia.vn
```

**Lưu ý**: `ISSUER_URL` và `URLS_SELF_ISSUER` là tương đương, dùng một trong hai.

#### Nếu dùng Docker Compose:

```yaml
services:
  hydra:
    image: oryd/hydra:v2.2.0
    environment:
      - ISSUER_URL=https://auth.foxia.vn
      # ... other configs
```

#### Nếu dùng Kubernetes:

```yaml
env:
  - name: ISSUER_URL
    value: "https://auth.foxia.vn"
```

### 2. Cấu hình trong Backend NestJS

Backend cần biết issuer URL để:
- Proxy OIDC discovery endpoint
- Validate tokens từ client applications

Thêm vào file `.env` của backend:

```bash
# Public URL của Hydra (không phải Kratos)
HYDRA_ISSUER_URL=https://oauth.foxia.vn
```

## Các trường hợp cấu hình

### Trường hợp 1: Development (Local)

```bash
# Hydra Server
ISSUER_URL=http://localhost:4444

# Backend
HYDRA_ISSUER_URL=http://localhost:4444
HYDRA_PUBLIC_URL=http://localhost:4444
```

### Trường hợp 2: Development với Docker

```bash
# Hydra Server (trong container)
ISSUER_URL=http://localhost:4444
# Hoặc nếu expose qua host
ISSUER_URL=http://localhost:4444

# Backend (trong container hoặc host)
HYDRA_ISSUER_URL=http://localhost:4444
HYDRA_PUBLIC_URL=http://hydra:4444  # Internal Docker network
```

### Trường hợp 3: Production với Reverse Proxy (Setup hiện tại)

```bash
# Hydra Server
ISSUER_URL=https://oauth.foxia.vn

# Backend
HYDRA_ISSUER_URL=https://oauth.foxia.vn
HYDRA_PUBLIC_URL=https://oauth.foxia.vn  # Hoặc internal URL nếu có
HYDRA_ADMIN_URL=https://admin-oauth.foxia.vn
KRATOS_PUBLIC_URL=https://auth.foxia.vn
```

**Setup Reverse Proxy (Nginx example):**

```nginx
server {
    listen 443 ssl;
    server_name auth.foxia.vn;

    location / {
        proxy_pass http://hydra-internal:4444;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Trường hợp 4: Production với Load Balancer

```bash
# Hydra Server
ISSUER_URL=https://oauth.foxia.vn

# Backend
HYDRA_ISSUER_URL=https://oauth.foxia.vn
HYDRA_PUBLIC_URL=https://oauth.foxia.vn  # Hoặc internal service URL
HYDRA_ADMIN_URL=https://admin-oauth.foxia.vn
```

## Kiểm tra cấu hình

### 1. Kiểm tra Hydra Discovery Endpoint

```bash
# Với HYDRA_ISSUER_URL=https://oauth.foxia.vn
curl https://oauth.foxia.vn/.well-known/openid-configuration

# Response sẽ có:
{
  "issuer": "https://oauth.foxia.vn",
  "authorization_endpoint": "https://oauth.foxia.vn/oauth2/auth",
  "token_endpoint": "https://oauth.foxia.vn/oauth2/token",
  ...
}
```

**Quan trọng**: Field `issuer` trong response phải khớp với `HYDRA_ISSUER_URL` bạn đã cấu hình.

### 2. Kiểm tra từ Backend

```bash
# Test discovery endpoint qua backend
curl http://localhost:3000/oauth2/.well-known/openid-configuration

# Kiểm tra issuer trong response
```

### 3. Validate Token

Token được issue bởi Hydra sẽ có `iss` (issuer) claim bằng `HYDRA_ISSUER_URL`:

```json
{
  "iss": "https://oauth.foxia.vn",
  "sub": "client-id",
  "aud": ["client-id"],
  "exp": 1234567890,
  ...
}
```

## Lưu ý quan trọng

### 1. HTTPS trong Production

Luôn sử dụng HTTPS cho `HYDRA_ISSUER_URL` trong production:

```bash
# ✅ Đúng
HYDRA_ISSUER_URL=https://auth.foxia.vn

# ❌ Sai (không an toàn)
HYDRA_ISSUER_URL=http://auth.foxia.vn
```

### 2. Không có trailing slash

```bash
# ✅ Đúng
HYDRA_ISSUER_URL=https://auth.foxia.vn

# ❌ Sai
HYDRA_ISSUER_URL=https://auth.foxia.vn/
```

### 3. Khớp với Reverse Proxy

Nếu dùng reverse proxy, đảm bảo:
- `ISSUER_URL` trong Hydra = public domain
- `HYDRA_ISSUER_URL` trong Backend = public domain
- `HYDRA_PUBLIC_URL` trong Backend = internal URL để gọi Hydra API

### 4. CORS Configuration

Nếu client applications chạy trên domain khác, cấu hình CORS trong Hydra:

```bash
CORS_ENABLED=true
CORS_ALLOWED_ORIGINS=https://app.foxia.vn,https://admin.foxia.vn
```

## Troubleshooting

### Lỗi: "issuer mismatch"

Nếu token validation fail với lỗi issuer mismatch:

1. Kiểm tra `ISSUER_URL` trong Hydra server
2. Kiểm tra `HYDRA_ISSUER_URL` trong Backend
3. Đảm bảo cả hai khớp nhau
4. Kiểm tra reverse proxy có forward đúng headers không

### Lỗi: "Invalid issuer"

1. Verify issuer trong token JWT:
   ```bash
   # Decode JWT token (chỉ phần header và payload)
   echo "YOUR_TOKEN" | cut -d. -f1,2 | base64 -d
   ```

2. So sánh `iss` claim với `HYDRA_ISSUER_URL`

### Lỗi: Discovery endpoint không accessible

1. Kiểm tra Hydra server đang chạy
2. Kiểm tra network connectivity
3. Kiểm tra reverse proxy/load balancer configuration
4. Verify firewall rules

## Ví dụ cấu hình hoàn chỉnh

### Development

```bash
# .env của Backend
HYDRA_ADMIN_URL=http://localhost:4445
HYDRA_PUBLIC_URL=http://localhost:4444
HYDRA_ISSUER_URL=http://localhost:4444
```

```bash
# Hydra server environment
ISSUER_URL=http://localhost:4444
```

### Production (Setup hiện tại)

```bash
# .env của Backend
KRATOS_PUBLIC_URL=https://auth.foxia.vn
HYDRA_ADMIN_URL=https://admin-oauth.foxia.vn
HYDRA_PUBLIC_URL=https://oauth.foxia.vn
HYDRA_ISSUER_URL=https://oauth.foxia.vn
```

```bash
# Hydra server environment
ISSUER_URL=https://oauth.foxia.vn
# HOẶC
URLS_SELF_ISSUER=https://oauth.foxia.vn
```

## Tài liệu tham khảo

- [Hydra Configuration](https://www.ory.sh/docs/hydra/configuration)
- [OIDC Discovery](https://openid.net/specs/openid-connect-discovery-1_0.html)

