# Mapping URLs trong hệ thống

## Tổng quan

Tài liệu này mô tả các URLs trong hệ thống và cách sử dụng chúng.

## URLs hiện tại

### 1. Kratos (Identity Provider)

```
https://auth.foxia.vn
```

**Mục đích**: Public link của Kratos để backend NestJS gọi Kratos API

**Sử dụng trong Backend**:
```bash
KRATOS_PUBLIC_URL=https://auth.foxia.vn
```

**Các endpoints**:
- `/self-service/login/browser` - Login flow
- `/self-service/registration/browser` - Registration flow
- `/sessions/whoami` - Session validation

### 2. Hydra Public (OAuth2/OIDC Authorization Server)

```
https://oauth.foxia.vn
```

**Mục đích**: Public link của Hydra cho client applications

**Sử dụng trong Backend**:
```bash
HYDRA_PUBLIC_URL=https://oauth.foxia.vn
HYDRA_ISSUER_URL=https://oauth.foxia.vn
```

**Các endpoints**:
- `/.well-known/openid-configuration` - OIDC Discovery
- `/.well-known/jwks.json` - JSON Web Key Set
- `/oauth2/token` - Token endpoint
- `/oauth2/introspect` - Token introspection
- `/oauth2/auth` - Authorization endpoint

**Client applications sử dụng**:
- Discovery OIDC configuration
- Request access tokens
- Validate tokens

### 3. Hydra Admin

```
https://admin-oauth.foxia.vn
```

**Mục đích**: Admin API của Hydra để quản lý OAuth2 clients

**Sử dụng trong Backend**:
```bash
HYDRA_ADMIN_URL=https://admin-oauth.foxia.vn
```

**Các endpoints**:
- `/admin/clients` - CRUD OAuth2 clients
- `/admin/oauth2/auth/sessions/login` - Login sessions
- `/admin/oauth2/auth/sessions/consent` - Consent sessions

## Cấu hình Backend

### File `.env`

```bash
# Kratos (Identity Provider)
KRATOS_PUBLIC_URL=https://auth.foxia.vn

# Hydra (OAuth2/OIDC Authorization Server)
HYDRA_ADMIN_URL=https://admin-oauth.foxia.vn
HYDRA_PUBLIC_URL=https://oauth.foxia.vn
HYDRA_ISSUER_URL=https://oauth.foxia.vn
```

## Cấu hình Hydra Server

### Environment Variables

```bash
# Issuer URL (phải khớp với HYDRA_ISSUER_URL trong Backend)
ISSUER_URL=https://oauth.foxia.vn
# HOẶC
URLS_SELF_ISSUER=https://oauth.foxia.vn

# Public và Admin ports (internal)
SERVE_PUBLIC_PORT=4444
SERVE_ADMIN_PORT=4445
```

## Luồng hoạt động

### 1. Client Application → Hydra

```
Client App
    ↓
https://oauth.foxia.vn/.well-known/openid-configuration
    ↓
Discovery OIDC config
    ↓
https://oauth.foxia.vn/oauth2/token
    ↓
Get access token
```

### 2. Backend → Kratos

```
Backend NestJS
    ↓
https://auth.foxia.vn/self-service/login/browser
    ↓
Kratos API calls
```

### 3. Backend → Hydra

```
Backend NestJS
    ↓
https://admin-oauth.foxia.vn/admin/clients (Admin API)
https://oauth.foxia.vn/oauth2/introspect (Public API)
    ↓
Hydra API calls
```

## Lưu ý quan trọng

1. **HYDRA_ISSUER_URL = https://oauth.foxia.vn**
   - Đây là public URL của Hydra (không phải Kratos)
   - Client applications sử dụng URL này

2. **KRATOS_PUBLIC_URL = https://auth.foxia.vn**
   - Đây là public URL của Kratos
   - Backend NestJS sử dụng URL này

3. **HYDRA_PUBLIC_URL = https://oauth.foxia.vn**
   - Public API của Hydra
   - Backend NestJS gọi để token introspection, discovery

4. **HYDRA_ADMIN_URL = https://admin-oauth.foxia.vn**
   - Admin API của Hydra
   - Backend NestJS gọi để quản lý OAuth2 clients

## Kiểm tra cấu hình

### 1. Kiểm tra Kratos

```bash
curl https://auth.foxia.vn/health/ready
```

### 2. Kiểm tra Hydra Public

```bash
curl https://oauth.foxia.vn/.well-known/openid-configuration
# Response phải có: "issuer": "https://oauth.foxia.vn"
```

### 3. Kiểm tra Hydra Admin

```bash
curl https://admin-oauth.foxia.vn/health/ready
```

## Troubleshooting

### Lỗi: Issuer mismatch

Nếu token có `iss` claim khác với `HYDRA_ISSUER_URL`:
- Kiểm tra `ISSUER_URL` trong Hydra server = `https://oauth.foxia.vn`
- Kiểm tra `HYDRA_ISSUER_URL` trong Backend = `https://oauth.foxia.vn`

### Lỗi: Cannot connect to Hydra

- Kiểm tra network connectivity
- Verify DNS resolution
- Kiểm tra firewall rules
- Verify SSL certificates (nếu dùng HTTPS)

