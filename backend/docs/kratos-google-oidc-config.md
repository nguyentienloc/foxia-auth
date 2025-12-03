# Hướng dẫn cấu hình Google OIDC cho Kratos

Tài liệu này hướng dẫn cách cấu hình Google OIDC provider trong Kratos để cho phép đăng nhập bằng Google.

## Tổng quan

Khi cấu hình Google OIDC provider trong Kratos, Kratos sẽ tự động thêm các nút OIDC vào login/registration flow. Frontend sẽ tự động render các nút này và xử lý redirect flow.

## Cấu hình trong kratos.yml

### 1. Cấu hình OIDC Provider

**Lưu ý quan trọng:** OIDC configuration phải nằm trong `selfservice.methods.oidc`, **KHÔNG PHẢI** `selfservice.oidc`.

Thêm cấu hình Google OIDC vào file `kratos.yml` trong section `selfservice.methods.oidc.config.providers`:

```yaml
selfservice:
  default_browser_return_url: https://auth.foxia.vn/  # Production URL
  # Hoặc dùng environment variable: ${KRATOS_BROWSER_RETURN_URL}
  
  flows:
    # Cấu hình UI URL cho các flows
    login:
      ui_url: https://auth.foxia.vn/login  # Frontend login page URL
      # Hoặc dùng environment variable: ${SELFSERVICE_FLOWS_LOGIN_UI_URL}
    
    registration:
      ui_url: https://auth.foxia.vn/registration  # Frontend registration page URL
      # Hoặc dùng environment variable: ${SELFSERVICE_FLOWS_REGISTRATION_UI_URL}
      # QUAN TRỌNG: Khi user login với OIDC lần đầu, Kratos sẽ redirect đến registration flow
      # Registration flow sẽ tự động điền thông tin từ OIDC (email, name, etc.)
      # User chỉ cần submit form để hoàn tất registration
      # Sau đó user sẽ được redirect về default_browser_return_url
    
    error:
      ui_url: https://auth.foxia.vn/error  # Frontend error page URL
      # Hoặc dùng environment variable: ${SELFSERVICE_FLOWS_ERROR_UI_URL}
  
  methods:
    oidc:
      enabled: true
      config:
        providers:
          # Google OIDC
          - id: google
            provider: google
            client_id: "${GOOGLE_CLIENT_ID}"
            client_secret: "${GOOGLE_CLIENT_SECRET}"
            mapper_url: "base64://bG9jYWwgY2xhaW1zID0gc3RkLmV4dFZhcignY2xhaW1zJyk7Cgp7CiAgaWRlbnRpdHk6IHsKICAgIHRyYWl0czogewogICAgICBlbWFpbDogaWYgJ2VtYWlsJyBpbiBjbGFpbXMgdGhlbiBjbGFpbXMuZW1haWwgZWxzZSBudWxsLAogICAgfSwKICB9LAp9Cg=="
            scope:
              - openid
              - email
              - profile
            requested_claims:
              id_token:
                email:
                  essential: true
                email_verified:
                  essential: true
```

### 2. Cấu hình Public URL và Cookie Domain cho Kratos

**Quan trọng:** Kratos cần được cấu hình với public URL và cookie domain để OIDC flow hoạt động đúng.

Trong `kratos.yml`, cấu hình public URL và cookie domain:

```yaml
serve:
  public:
    base_url: https://auth.foxia.vn/  # Public URL của Kratos
    # Hoặc dùng environment variable: ${KRATOS_PUBLIC_URL}

# Cấu hình cookie domain để cookie được set với domain đúng
# Điều này QUAN TRỌNG cho OIDC flow vì cookie phải được gửi khi Google redirect về
cookies:
  domain: auth.foxia.vn  # Domain của Kratos (không có protocol)
  # Hoặc dùng environment variable: ${COOKIE_DOMAIN}
```

Hoặc dùng environment variables:

```bash
KRATOS_PUBLIC_URL=https://auth.foxia.vn/
COOKIE_DOMAIN=auth.foxia.vn
```

**Lưu ý:** 
- Public URL này phải khớp với URL mà bạn dùng để gọi Kratos API từ frontend
- Kratos sẽ dùng URL này để tạo redirect URI cho OIDC callback
- **Cookie domain** phải là domain của Kratos (không có protocol, không có port)
- Cookie domain này đảm bảo cookie `ory_kratos_oidc_auth_code_session` được set với domain đúng
- Khi Google redirect về Kratos callback, cookie sẽ được gửi đúng vì domain khớp
- Nếu không cấu hình, Kratos có thể dùng internal URL (như `prod-zs-kratos-86b87ddd78-jbvch:4433`) và sẽ gây lỗi

### 3. Cấu hình CORS (Quan trọng cho OIDC)

Khi frontend submit form trực tiếp đến Kratos (không qua backend proxy) để đảm bảo cookie được set đúng, cần cấu hình CORS trong Kratos:

**Lưu ý quan trọng:** Tất cả các properties CORS phải nằm trong `serve.public.cors`, **KHÔNG PHẢI** ở level `serve.public`.

```yaml
serve:
  public:
    base_url: https://auth.foxia.vn/  # Public URL của Kratos
    cors:
      enabled: true
      allowed_origins:
        - https://auth.foxia.vn  # Production frontend URL
        - http://localhost:5108  # Dev frontend URL
      allowed_methods:
        - POST
        - GET
        - OPTIONS
      allowed_headers:
        - Content-Type
        - X-CSRF-Token
      exposed_headers:
        - Set-Cookie
        - Location  # Required for OIDC redirect to work with fetch API
      allow_credentials: true  # BẮT BUỘC để cookie được gửi/nhận
      max_age: 3600
```

Hoặc dùng environment variables:

```bash
# CORS configuration
SERVE_PUBLIC_CORS_ENABLED=true
SERVE_PUBLIC_CORS_ALLOWED_ORIGINS=https://auth.foxia.vn,http://localhost:5108
SERVE_PUBLIC_CORS_ALLOW_CREDENTIALS=true
SERVE_PUBLIC_CORS_ALLOWED_METHODS=POST,GET,OPTIONS
SERVE_PUBLIC_CORS_ALLOWED_HEADERS=Content-Type,X-CSRF-Token
SERVE_PUBLIC_CORS_EXPOSED_HEADERS=Set-Cookie
SERVE_PUBLIC_CORS_MAX_AGE=3600
```

**Lưu ý:** 
- `allow_credentials: true` là **BẮT BUỘC** để cookie được gửi và nhận đúng cách trong OIDC flow.
- **KHÔNG** đặt `allowed_origins`, `allow_credentials`, `enabled` ở level `serve.public` - chúng phải nằm trong `serve.public.cors`.

### 4. Environment Variables

Đảm bảo các biến môi trường sau được cấu hình:

```bash
# Kratos Public URL (quan trọng cho OIDC redirect URI)
KRATOS_PUBLIC_URL=https://auth.foxia.vn/

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional: Override default browser return URL
KRATOS_BROWSER_RETURN_URL=https://auth.foxia.vn/

# UI URLs for flows (BẮT BUỘC)
SELFSERVICE_FLOWS_LOGIN_UI_URL=https://auth.foxia.vn/login
SELFSERVICE_FLOWS_REGISTRATION_UI_URL=https://auth.foxia.vn/registration
SELFSERVICE_FLOWS_ERROR_UI_URL=https://auth.foxia.vn/error
```

### 5. Cấu hình cho môi trường Dev

**Quan trọng:** Theo tài liệu Kratos: "Running the services on different ports is ok, if the domain stays the same" - Có thể chạy frontend và Kratos trên cùng domain nhưng khác port.

**Giải pháp cho Dev:**

#### Option 1: Sử dụng Vite Proxy (KHUYẾN NGHỊ - Đơn giản nhất)

**Ưu điểm:**
- Chỉ cần cấu hình trong `vite.config.ts` (dev only)
- Production không cần thay đổi gì
- Tự động rewrite cookie domain
- Không cần setup Nginx hay reverse proxy riêng

**Cấu hình Vite (`frontend/vite.config.ts`):**

```typescript
export default defineConfig({
  server: {
    port: 5108,
    proxy: {
      // Proxy Kratos requests to production Kratos (only in dev)
      "/kratos": {
        target: "https://auth.foxia.vn",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/kratos/, ""),
        configure: (proxy, _options) => {
          proxy.on("proxyRes", (proxyRes, req, res) => {
            // Rewrite Set-Cookie domain from auth.foxia.vn to localhost
            const setCookieHeaders = proxyRes.headers["set-cookie"];
            if (setCookieHeaders) {
              const rewritten = Array.isArray(setCookieHeaders)
                ? setCookieHeaders
                : [setCookieHeaders];
              proxyRes.headers["set-cookie"] = rewritten.map((cookie) =>
                cookie.replace(/domain=auth\.foxia\.vn/gi, "domain=localhost")
              );
            }
          });
        },
      },
    },
  },
});
```

**Cấu hình Kratos:**

```yaml
serve:
  public:
    base_url: http://localhost:5108/kratos/  # Vite proxy URL (dev only)

selfservice:
  default_browser_return_url: http://localhost:5108  # Frontend dev URL

cookies:
  domain: localhost  # Cookie domain là localhost (qua Vite proxy)
```

**Lưu ý:**
- Frontend code đã tự động detect dev mode và sử dụng `/kratos/...` (relative path)
- Vite proxy sẽ forward requests từ `/kratos/*` đến `https://auth.foxia.vn/*`
- Cookie domain được rewrite từ `auth.foxia.vn` → `localhost`
- Production: Frontend sẽ tự động sử dụng `https://auth.foxia.vn/...` (absolute URL)
- **Không cần thay đổi gì khi deploy production**

#### Option 2: Chạy Kratos trên localhost (CÙNG DOMAIN với frontend)

Cấu hình Kratos chạy trên `localhost` (cùng domain với frontend):

```yaml
serve:
  public:
    base_url: http://localhost:4433/  # Kratos chạy trên localhost:4433
    port: 4433

selfservice:
  default_browser_return_url: http://localhost:5108  # Frontend chạy trên localhost:5108

# Cookie domain: KHÔNG SET hoặc set localhost
# Nếu không set, browser sẽ tự động set domain là localhost
cookies:
  # domain: localhost  # Optional: có thể set hoặc không
```

**Lưu ý:** 
- Frontend: `http://localhost:5108`
- Kratos: `http://localhost:4433`
- Cùng domain `localhost` → Cookie được gửi đúng
- Cookie domain không cần set (browser tự set là `localhost`)

#### Option 3: Reverse Proxy từ localhost đến auth.foxia.vn (Nginx/Caddy)

**Setup:** Frontend dev ở `localhost:5108`, Kratos ở `auth.foxia.vn`, sử dụng reverse proxy để forward requests.

**Cấu hình Reverse Proxy (Nginx/Caddy):**

```nginx
# Nginx config - Forward requests từ localhost:5108 đến auth.foxia.vn
server {
    listen 5108;
    server_name localhost;

    # Forward Kratos API requests
    location /kratos/ {
        proxy_pass https://auth.foxia.vn/;
        proxy_set_header Host auth.foxia.vn;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host auth.foxia.vn;
        
        # Forward cookies từ Kratos
        proxy_cookie_domain auth.foxia.vn localhost;
        proxy_cookie_path / /;
        
        # Forward all headers
        proxy_pass_header Set-Cookie;
        proxy_pass_header Cookie;
    }
}
```

**Cấu hình Kratos:**

```yaml
serve:
  public:
    base_url: https://auth.foxia.vn/  # Kratos vẫn ở auth.foxia.vn

selfservice:
  default_browser_return_url: http://localhost:5108  # Frontend dev URL

cookies:
  domain: auth.foxia.vn  # Cookie domain vẫn là auth.foxia.vn
```

**Cấu hình Frontend:**

Frontend cần submit form đến reverse proxy URL (không trực tiếp đến Kratos):

```typescript
// Frontend submit đến reverse proxy
const kratosEndpoint = `http://localhost:5108/kratos/self-service/methods/oidc?flow=${flowId}`;
```

**Lưu ý:**
- Reverse proxy sẽ forward cookie từ Kratos về frontend
- Cookie domain vẫn là `auth.foxia.vn` (từ Kratos)
- Reverse proxy cần rewrite cookie domain từ `auth.foxia.vn` → `localhost` (dùng `proxy_cookie_domain`)
- Hoặc frontend cần accept cookie với domain `auth.foxia.vn` (có thể không work trong dev)

**Vấn đề:** Cookie domain `auth.foxia.vn` có thể không được browser accept khi frontend ở `localhost:5108`.

**Giải pháp tốt hơn:** Sử dụng reverse proxy để route paths trên cùng domain (Option 3).

#### Option 4: Reverse Proxy route paths trên cùng domain (Nginx/Caddy)

Sử dụng reverse proxy để route paths trên cùng domain `localhost`:

```nginx
# Nginx config - Route paths trên localhost
server {
    listen 5108;
    server_name localhost;

    # Frontend (React app)
    location / {
        proxy_pass http://localhost:5173;  # Frontend dev server
    }

    # Kratos API (forward đến auth.foxia.vn)
    location /kratos/ {
        proxy_pass https://auth.foxia.vn/;
        proxy_set_header Host auth.foxia.vn;
        proxy_set_header X-Forwarded-Proto https;
        
        # Rewrite cookie domain từ auth.foxia.vn → localhost
        proxy_cookie_domain auth.foxia.vn localhost;
        proxy_cookie_path / /;
        
        # Forward all headers
        proxy_pass_header Set-Cookie;
    }
}
```

**Cấu hình Kratos:**

```yaml
serve:
  public:
    base_url: http://localhost:5108/kratos/  # Kratos accessible qua reverse proxy

selfservice:
  default_browser_return_url: http://localhost:5108  # Frontend URL

cookies:
  domain: localhost  # Cookie domain là localhost (qua reverse proxy)
```

**Cấu hình Frontend:**

1. Set environment variable:
```bash
VITE_KRATOS_REVERSE_PROXY_URL=http://localhost:5108/kratos
```

2. Frontend code đã tự động detect và sử dụng reverse proxy URL nếu có.

**Lưu ý:**
- Frontend: `http://localhost:5108/`
- Kratos: `http://localhost:5108/kratos/...` (qua reverse proxy)
- Cùng domain `localhost` → Cookie được gửi đúng
- Reverse proxy rewrite cookie domain từ `auth.foxia.vn` → `localhost`
- **Quan trọng:** Kratos config `serve.public.base_url` phải là `http://localhost:5108/kratos/` (reverse proxy URL), không phải `https://auth.foxia.vn/`

#### a. Cấu hình Public URL và `default_browser_return_url` trong Kratos (Option 1):

```yaml
serve:
  public:
    base_url: http://localhost:4433/  # Kratos chạy trên localhost:4433
    port: 4433

selfservice:
  default_browser_return_url: http://localhost:5108  # Frontend dev URL
```

Hoặc dùng environment variables:

```bash
KRATOS_PUBLIC_URL=http://localhost:4433/
KRATOS_BROWSER_RETURN_URL=http://localhost:5108
```

#### b. Cấu hình Google OAuth Console cho Dev:

**Lưu ý quan trọng:**
- Authorized redirect URIs phải là **PUBLIC URL của Kratos**, không phải internal URL
- URL phải khớp **chính xác** với redirect URI mà Kratos gửi đến Google
- Không được dùng internal service URL (như `prod-zs-kratos-86b87ddd78-jbvch:4433`)

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Vào **APIs & Services** > **Credentials**
4. Chọn OAuth 2.0 Client ID của bạn
5. Thêm **Authorized redirect URIs** (PUBLIC URL của Kratos):
   - Dev: `http://<kratos-public-dev-url>/self-service/methods/oidc/callback/google`
     - Ví dụ: `http://localhost:3000/self-service/methods/oidc/callback/google` (nếu Kratos dev public ở localhost:3000)
     - **Lưu ý:** Phải là public URL (giá trị của `KRATOS_PUBLIC_URL`), không phải internal service URL
   - Production: `https://<kratos-public-prod-url>/self-service/methods/oidc/callback/google`
     - Ví dụ: `https://auth.foxia.vn/self-service/methods/oidc/callback/google` (nếu `KRATOS_PUBLIC_URL=https://auth.foxia.vn/`)
     - **Lưu ý:** Phải là public URL mà Google có thể access được, và phải khớp với `KRATOS_PUBLIC_URL` trong Kratos config

**Kiểm tra redirect URI đúng:**
- Xem error message từ Google: `redirect_uri=https://prod-zs-kratos-86b87ddd78-jbvch:4433/...`
- Đây là internal URL, nghĩa là Kratos chưa được cấu hình `serve.public.base_url` hoặc `KRATOS_PUBLIC_URL`
- **Cách sửa:** Thêm cấu hình `serve.public.base_url: https://auth.foxia.vn/` hoặc set `KRATOS_PUBLIC_URL=https://auth.foxia.vn/`
- Sau đó restart Kratos và test lại

**Giải thích flow:**
- User click "Google" trên frontend → redirect đến Google OAuth
- Google authenticate → redirect về **Kratos PUBLIC callback URL** (đây là URL cần cấu hình trong Google Console)
- Kratos xử lý callback → redirect về frontend (theo `default_browser_return_url`)

### 5. Cấu hình Error UI

Kratos cần được cấu hình với error UI URL để hiển thị lỗi khi có vấn đề xảy ra (ví dụ: OIDC callback error).

Trong `kratos.yml`:

```yaml
selfservice:
  flows:
    error:
      ui_url: https://auth.foxia.vn/error  # Frontend error page URL
      # Hoặc dùng environment variable: ${SELFSERVICE_FLOWS_ERROR_UI_URL}
```

Hoặc dùng environment variable:

```bash
SELFSERVICE_FLOWS_ERROR_UI_URL=https://auth.foxia.vn/error
```

**Lưu ý:**
- Error UI URL phải là frontend URL (không phải Kratos URL)
- Khi có lỗi, Kratos sẽ redirect về URL này với query parameter `?id=<error_id>`
- Frontend error page sẽ gọi backend API `/auth/error?id=<error_id>` để lấy chi tiết lỗi

### 6. Cấu hình CORS

Đảm bảo Kratos cho phép frontend gọi API. Trong `kratos.yml`:

```yaml
serve:
  public:
    cors:
      enabled: true
      allowed_origins:
        - http://localhost:5108      # Dev
        - https://auth.foxia.vn       # Production
      allowed_methods:
        - POST
        - GET
        - PUT
        - PATCH
        - DELETE
      allowed_headers:
        - Authorization
        - Content-Type
        - X-Session-Token
      exposed_headers:
        - Content-Type
        - Set-Cookie
      allow_credentials: true
```

## Mapper Configuration

Mapper được encode base64 trong `mapper_url`. Mapper này map thông tin từ Google claims vào Kratos identity traits:

- `email` → `traits.email`
- `email_verified` → `traits.email_verified`
- `name` → `traits.name`
- `given_name` → `traits.given_name`
- `family_name` → `traits.family_name`
- `picture` → `traits.picture`

## Flow hoạt động

### OIDC Authorization Code Flow với Kratos

**Tại sao cần cookie continuity session?**

OIDC flow sử dụng **Authorization Code Flow**:
1. User click "Google" → Kratos redirect đến Google với:
   - `client_id`
   - `redirect_uri` (Kratos callback URL)
   - `state` (để verify sau khi Google redirect về)
   - `code_challenge` (PKCE - để bảo mật)
   - `scope` (openid, email, profile)

2. User authenticate với Google → Google redirect về Kratos callback với:
   - `code` (authorization code)
   - `state` (để verify)

3. **Vấn đề:** Khi Google redirect về, Kratos cần:
   - Verify `state` parameter (đảm bảo request hợp lệ, tránh CSRF)
   - Verify `code` với Google (exchange code lấy token)
   - Biết flow ID nào đang được xử lý
   - Biết `code_verifier` (PKCE) để verify `code_challenge`
   - Các thông tin khác về flow context

4. **Giải pháp:** Kratos sử dụng **continuity session cookie** (`ory_kratos_oidc_auth_code_session`) để lưu:
   - Flow ID
   - State parameter
   - PKCE code verifier
   - Provider ID (google)
   - Các thông tin khác cần thiết để hoàn thành flow

5. Khi Google redirect về, Kratos:
   - Đọc cookie `ory_kratos_oidc_auth_code_session`
   - Lấy flow context từ cookie
   - Verify `state` parameter
   - Exchange `code` với Google để lấy token (sử dụng `code_verifier` cho PKCE)
   - Tạo/update identity từ Google user info
   - Tạo session và redirect về frontend

**Flow chi tiết:**

1. User click nút "Google" trên frontend
2. Frontend submit form trực tiếp đến Kratos: `https://auth.foxia.vn/self-service/methods/oidc?flow=<flow_id>`
   - Form includes: `provider=google` và `csrf_token` từ flow hiện tại
   - Browser tự động gửi cookie CSRF khi submit đến cùng domain (nếu cookie domain đúng)
3. Kratos validate CSRF token và **set continuity session cookie** (`ory_kratos_oidc_auth_code_session`)
   - Cookie này chứa: flow ID, state, PKCE code verifier, provider ID
4. Kratos redirect đến Google OAuth URL với:
   - `state` parameter (để verify sau)
   - `code_challenge` (PKCE)
   - `redirect_uri` (Kratos callback URL)
5. User authenticate với Google
6. Google redirect về Kratos callback URL: `https://auth.foxia.vn/self-service/methods/oidc/callback/google?code=...&state=...`
   - Browser tự động gửi continuity session cookie (vì domain khớp: `auth.foxia.vn`)
7. Kratos xử lý callback:
   - Đọc cookie `ory_kratos_oidc_auth_code_session` để lấy flow context
   - Verify `state` parameter
   - Exchange `code` với Google để lấy access token và ID token (sử dụng `code_verifier` cho PKCE)
   - Parse ID token để lấy user info (email, name, etc.)
   - Tạo/update identity từ user info
   - Tạo session và redirect về `default_browser_return_url` với session cookie
8. Frontend nhận session cookie và user đã đăng nhập

**Lưu ý quan trọng:**
- **Cookie continuity session là BẮT BUỘC** để Kratos biết flow context khi Google redirect về
- Không có cookie này, Kratos không biết flow nào đang được xử lý và sẽ báo lỗi "no resumable session found"
- Frontend và Kratos phải chạy trên cùng domain (hoặc subdomain) để cookie được gửi đúng
- Nếu frontend chạy ở `localhost:5108` và Kratos ở `auth.foxia.vn`, cookie không được gửi vì domain không khớp
- Giải pháp: Sử dụng reverse proxy để route paths trên cùng domain, hoặc chạy frontend và Kratos trên cùng domain

## Testing

### Test ở Dev:

**Option 1: Kratos trên localhost (KHUYẾN NGHỊ)**

1. Đảm bảo Kratos dev có:
   - `default_browser_return_url: http://localhost:5108` (frontend URL)
   - `flows.error.ui_url: http://localhost:5108/error` (frontend error page URL)
   - `serve.public.base_url: http://localhost:4433/` (Kratos chạy trên localhost:4433)
   - `cookies.domain`: KHÔNG SET hoặc `localhost` (để cookie được set với domain localhost)
2. Đảm bảo Google OAuth Console có redirect URI: `http://localhost:4433/self-service/methods/oidc/callback/google`
3. Start Kratos: `kratos serve --dev` (chạy ở port 4433)
4. Start frontend: `cd frontend && yarn dev` (chạy ở port 5108)
5. Start backend (nếu cần)
6. Vào `http://localhost:5108/login`
7. Click nút Google và test flow
   - Form sẽ submit đến `http://localhost:4433/self-service/methods/oidc?flow=...`
   - Cookie CSRF sẽ được gửi vì cùng domain `localhost`

**Option 2: Sử dụng Reverse Proxy**

1. Setup reverse proxy (Nginx/Caddy) để route paths trên cùng domain
2. Frontend: `http://localhost:5108/`
3. Kratos: `http://localhost:5108/kratos/...`
4. Cấu hình tương tự như Option 1 nhưng base_url là `http://localhost:5108/kratos/`

### Test ở Production:

1. Đảm bảo Kratos production có:
   - `default_browser_return_url: https://auth.foxia.vn/` (frontend URL)
   - `flows.error.ui_url: https://auth.foxia.vn/error` (frontend error page URL)
   - `serve.public.base_url: https://auth.foxia.vn/` (public Kratos URL)
2. Đảm bảo Google OAuth Console có redirect URI: `https://auth.foxia.vn/self-service/methods/oidc/callback/google` (Kratos public URL)
3. Deploy và test

## Troubleshooting

### Lỗi: "redirect_uri_mismatch" hoặc "Error 400: invalid_request"

- **Quan trọng:** 
  - Redirect URI trong Google OAuth Console phải là **PUBLIC URL của Kratos**, không phải internal URL
  - URL phải khớp **chính xác** với redirect URI mà Kratos gửi đến Google
- **Nguyên nhân thường gặp:**
  - Kratos đang gửi internal URL (như `prod-zs-kratos-86b87ddd78-jbvch:4433`) thay vì public URL
  - Redirect URI trong Google Console không khớp với redirect URI mà Kratos gửi
- **Cách sửa:**
  1. Xem error message để biết redirect URI mà Kratos đang gửi
  2. Đảm bảo Kratos config sử dụng public URL (không phải internal service URL)
  3. Thêm chính xác redirect URI đó vào Google OAuth Console
  4. Format: `http(s)://<kratos-public-url>/self-service/methods/oidc/callback/google`
- **Ví dụ:**
  - Nếu error hiển thị: `redirect_uri=https://prod-zs-kratos-86b87ddd78-jbvch:4433/...`
  - Cần thay bằng public URL: `https://kratos.foxia.vn/self-service/methods/oidc/callback/google`
  - Thêm public URL này vào Google OAuth Console
- **KHÔNG** dùng:
  - Frontend URL như `http://localhost:5108` hoặc `https://auth.foxia.vn`
  - Internal service URL như `prod-zs-kratos-86b87ddd78-jbvch:4433`

### Lỗi: CORS

- Kiểm tra CORS config trong Kratos
- Đảm bảo `allowed_origins` bao gồm frontend URL
- Đảm bảo `allow_credentials: true`

### OIDC buttons không hiển thị

- Kiểm tra `selfservice.methods.oidc.enabled: true` trong config (phải nằm trong `methods`, không phải ở level `selfservice`)
- Kiểm tra provider config đúng và nằm trong `selfservice.methods.oidc.config.providers`
- Kiểm tra frontend có render OIDC nodes từ flow không (mở browser console để xem logs)

### Lỗi: "no resumable session found" hoặc "The browser does not contain the necessary cookie"

- **Nguyên nhân:** Kratos không tìm thấy continuity session cookie (`ory_kratos_oidc_auth_code_session`) khi Google redirect về
- **Vấn đề cốt lõi (theo tài liệu Kratos):** 
  - **"Cookies work best on the same domain"** - Frontend và Kratos phải chạy trên cùng domain
  - Khi frontend chạy ở `localhost:5108` và Kratos ở `auth.foxia.vn`, cookie CSRF không được gửi vì domain không khớp
  - Browser chỉ gửi cookie khi domain khớp với domain của request
- **Cách sửa (theo tài liệu Kratos):**
  1. **Chạy Frontend và Kratos trên cùng domain (GIẢI PHÁP TỐT NHẤT):**
     - Sử dụng reverse proxy (Nginx, Envoy, AWS API Gateway) để route paths trên cùng domain
     - Ví dụ: 
       - `https://auth.foxia.vn/` → Frontend
       - `https://auth.foxia.vn/kratos/...` → Kratos (via reverse proxy)
     - Điều này đảm bảo cookie được gửi đúng vì cùng domain
  2. **Cấu hình Cookie Domain trong Kratos:**
     ```yaml
     cookies:
       domain: auth.foxia.vn  # Domain của Kratos (không có protocol, không có port)
     ```
     - Cookie domain phải là domain của Kratos (ví dụ: `auth.foxia.vn`)
     - Điều này đảm bảo cookie được set với domain đúng
  3. **Submit form TRỰC TIẾP đến Kratos:**
     - Form action phải là: `https://auth.foxia.vn/self-service/methods/oidc?flow=<flow_id>`
     - Browser sẽ tự động gửi cookie CSRF khi submit đến cùng domain
     - **Lưu ý:** Cookie CSRF phải được set với domain `auth.foxia.vn` (không phải `localhost`)
     - **Vấn đề:** Nếu flow được lấy qua backend proxy, cookie CSRF có thể được set với domain của backend (localhost) thay vì domain của Kratos
     - **Giải pháp:** Cần lấy flow trực tiếp từ Kratos để cookie CSRF được set với domain đúng, hoặc đảm bảo backend forward cookie với domain đúng
  4. **Cấu hình CORS đúng trong Kratos:**
     - `allow_credentials: true` là bắt buộc
     - `allowed_origins` phải chứa frontend URL
  5. **Kiểm tra cookie trong browser DevTools:**
     - Cookie `ory_kratos_oidc_auth_code_session` phải được set sau khi submit form
     - Cookie domain phải là domain của Kratos (ví dụ: `auth.foxia.vn`)
     - Cookie path phải là `/` hoặc `/self-service/`
  6. **Clear browser cookies và thử lại**
- **Lưu ý quan trọng (theo tài liệu Kratos):** 
  - **Frontend và Kratos phải chạy trên cùng domain** để cookie được gửi đúng
  - Nếu chạy trên domain khác nhau, cookie CSRF không được gửi khi submit form
  - Giải pháp tốt nhất: Sử dụng reverse proxy để route paths trên cùng domain
  - Cookie domain trong Kratos config đảm bảo cookie được set với domain đúng
  - Cookie path phải là `/` hoặc path phù hợp để được gửi khi redirect về callback URL

## Tham khảo

- [Kratos OIDC Documentation](https://www.ory.sh/docs/kratos/guides/social-sign-in-google-microsoft-github)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)

