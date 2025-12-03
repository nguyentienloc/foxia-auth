# Hướng dẫn cấu hình Facebook OIDC cho Kratos

Tài liệu này hướng dẫn cách cấu hình Facebook OIDC provider trong Kratos để cho phép đăng nhập bằng Facebook.

## Tổng quan

Khi cấu hình Facebook OIDC provider trong Kratos, Kratos sẽ tự động thêm các nút OIDC vào login/registration flow. Frontend sẽ tự động render các nút này và xử lý redirect flow.

## Cấu hình trong kratos.yml

### 1. Cấu hình OIDC Provider

**Lưu ý quan trọng:** OIDC configuration phải nằm trong `selfservice.methods.oidc`, **KHÔNG PHẢI** `selfservice.oidc`.

Thêm cấu hình Facebook OIDC vào file `kratos.yml` trong section `selfservice.methods.oidc.config.providers` (cùng với Google):

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
          # Google OIDC (đã có sẵn)
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
          
          # Facebook OIDC (thêm mới)
          - id: facebook
            provider: facebook
            client_id: "${FACEBOOK_CLIENT_ID}"
            client_secret: "${FACEBOOK_CLIENT_SECRET}"
            mapper_url: "base64://bG9jYWwgY2xhaW1zID0gc3RkLmV4dFZhcignY2xhaW1zJyk7Cgp7CiAgaWRlbnRpdHk6IHsKICAgIHRyYWl0czogewogICAgICBlbWFpbDogaWYgJ2VtYWlsJyBpbiBjbGFpbXMgdGhlbiBjbGFpbXMuZW1haWwgZWxzZSBudWxsLAogICAgICBuYW1lOiBpZiAnbmFtZScgaW4gY2xhaW1zIHRoZW4gY2xhaW1zLm5hbWUgZWxzZSBudWxsLAogICAgICBwaWN0dXJlOiBpZiAncGljdHVyZScgaW4gY2xhaW1zIHRoZW4gY2xhaW1zLnBpY3R1cmUuZGF0YS51cmwgZWxzZSBudWxsLAogICAgfSwKICB9LAp9Cg=="
            scope:
              - email
              - public_profile
            requested_claims:
              id_token:
                email:
                  essential: true
```

**Lưu ý về Facebook OIDC:**
- Facebook sử dụng OAuth 2.0 nhưng không hoàn toàn tuân thủ OIDC standard
- Facebook provider trong Kratos hỗ trợ Facebook Login nhưng có một số khác biệt so với Google
- Scope: Facebook sử dụng `email` và `public_profile` thay vì `openid`, `email`, `profile`
- Facebook không hỗ trợ `email_verified` claim như Google

### 2. Environment Variables

Thêm các biến môi trường cho Facebook OAuth credentials:

```bash
# Kratos Public URL (quan trọng cho OIDC redirect URI)
KRATOS_PUBLIC_URL=https://auth.foxia.vn/

# Google OAuth Credentials (đã có)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth Credentials (thêm mới)
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# Optional: Override default browser return URL
KRATOS_BROWSER_RETURN_URL=https://auth.foxia.vn/

# UI URLs for flows (BẮT BUỘC)
SELFSERVICE_FLOWS_LOGIN_UI_URL=https://auth.foxia.vn/login
SELFSERVICE_FLOWS_REGISTRATION_UI_URL=https://auth.foxia.vn/registration
SELFSERVICE_FLOWS_ERROR_UI_URL=https://auth.foxia.vn/error
```

### 3. Cấu hình Facebook App trong Facebook Developer Console

1. **Truy cập Facebook for Developers:**
   - Vào [Facebook for Developers](https://developers.facebook.com/)
   - Đăng nhập với tài khoản Facebook của bạn

2. **Tạo ứng dụng mới (nếu chưa có):**
   - Click "My Apps" > "Create App"
   - Chọn loại app: "Consumer" hoặc "Business"
   - Điền App Name, App Contact Email
   - Click "Create App"

3. **Thêm Facebook Login product:**
   - Vào Dashboard của app
   - Tìm "Facebook Login" trong Products list
   - Click "Set Up" để thêm Facebook Login

4. **Cấu hình Facebook Login Settings:**
   - Vào Settings > Basic để xem App ID và App Secret
   - Vào Settings > Facebook Login > Settings
   - Thêm **Valid OAuth Redirect URIs**:
     - **Production (BẮT BUỘC):** `https://auth.foxia.vn/self-service/methods/oidc/callback/facebook`
     - **Dev (nếu Kratos chạy localhost riêng):** `http://localhost:4433/self-service/methods/oidc/callback/facebook`
     - **KHÔNG THÊM** `http://localhost:5108/kratos/...` vì đây là Vite proxy URL, không phải URL thực của Kratos
   
   **Lưu ý quan trọng:**
   - Redirect URI phải là **PUBLIC URL thực của Kratos** (giá trị của `KRATOS_PUBLIC_URL`), không phải:
     - ❌ Frontend URL (localhost:5108)
     - ❌ Vite proxy URL (localhost:5108/kratos/...)
     - ❌ Internal service URL
   - URL phải khớp **chính xác** với redirect URI mà Kratos gửi đến Facebook
   - Format: `http(s)://<kratos-public-url>/self-service/methods/oidc/callback/facebook`
   - **Trong setup hiện tại:** Vì frontend dùng Vite proxy và Kratos chạy ở `https://auth.foxia.vn`, redirect URI phải là `https://auth.foxia.vn/self-service/methods/oidc/callback/facebook`

5. **Lấy App ID và App Secret:**
   - App ID: Vào Settings > Basic > App ID
   - App Secret: Vào Settings > Basic > App Secret (click "Show" để hiện)

6. **Cấu hình App Domains (nếu cần):**
   - Vào Settings > Basic
   - Thêm domain của bạn vào "App Domains": `auth.foxia.vn`

7. **Privacy Policy URL và Terms of Service URL:**
   - Vào Settings > Basic
   - Thêm Privacy Policy URL (bắt buộc cho production)
   - Thêm Terms of Service URL (nếu có)

### 4. Mapper Configuration

Mapper được encode base64 trong `mapper_url`. Mapper này map thông tin từ Facebook claims vào Kratos identity traits.

**Facebook Mapper (đã được encode trong config trên):**

```jsonnet
local claims = std.extVar('claims');

{
  identity: {
    traits: {
      email: if 'email' in claims then claims.email else null,
      name: if 'name' in claims then claims.name else null,
      picture: if 'picture' in claims then claims.picture.data.url else null,
    },
  },
}
```

**Giải thích mapper:**
- `email` → `traits.email` (từ Facebook email field)
- `name` → `traits.name` (từ Facebook name field)
- `picture` → `traits.picture` (từ Facebook picture.data.url field)

**Lưu ý:**
- Facebook trả về picture dưới dạng object với structure: `{ data: { url: "..." } }`
- Mapper cần truy cập `claims.picture.data.url` để lấy URL ảnh
- Nếu muốn thêm các fields khác, có thể customize mapper

**Để decode mapper hiện tại và xem nội dung:**

```bash
echo "bG9jYWwgY2xhaW1zID0gc3RkLmV4dFZhcignY2xhaW1zJyk7Cgp7CiAgaWRlbnRpdHk6IHsKICAgIHRyYWl0czogewogICAgICBlbWFpbDogaWYgJ2VtYWlsJyBpbiBjbGFpbXMgdGhlbiBjbGFpbXMuZW1haWwgZWxzZSBudWxsLAogICAgICBuYW1lOiBpZiAnbmFtZScgaW4gY2xhaW1zIHRoZW4gY2xhaW1zLm5hbWUgZWxzZSBudWxsLAogICAgICBwaWN0dXJlOiBpZiAncGljdHVyZScgaW4gY2xhaW1zIHRoZW4gY2xhaW1zLnBpY3R1cmUuZGF0YS51cmwgZWxzZSBudWxsLAogICAgfSwKICB9LAp9Cg==" | base64 -d
```

**Để encode mapper mới:**

```bash
# Tạo file mapper.jsonnet
cat > mapper.jsonnet << 'EOF'
local claims = std.extVar('claims');

{
  identity: {
    traits: {
      email: if 'email' in claims then claims.email else null,
      name: if 'name' in claims then claims.name else null,
      picture: if 'picture' in claims then claims.picture.data.url else null,
    },
  },
}
EOF

# Encode sang base64
cat mapper.jsonnet | base64 -w 0
```

### 5. Flow hoạt động

Flow hoạt động tương tự như Google OIDC:

1. User click nút "Facebook" trên frontend
2. Frontend submit form trực tiếp đến Kratos: `https://auth.foxia.vn/self-service/methods/oidc?flow=<flow_id>&provider=facebook`
3. Kratos validate CSRF token và set continuity session cookie
4. Kratos redirect đến Facebook OAuth URL
5. User authenticate với Facebook
6. Facebook redirect về Kratos callback URL: `https://auth.foxia.vn/self-service/methods/oidc/callback/facebook?code=...&state=...`
7. Kratos xử lý callback:
   - Đọc cookie để lấy flow context
   - Verify state parameter
   - Exchange code với Facebook để lấy access token
   - Lấy user info từ Facebook Graph API
   - Tạo/update identity từ user info
   - Tạo session và redirect về frontend

### 6. Cấu hình cho môi trường Dev

**QUAN TRỌNG:** Setup hiện tại sử dụng Vite proxy để proxy `/kratos/*` requests từ frontend dev (`localhost:5108`) đến Kratos production (`https://auth.foxia.vn`). Vì vậy:

- **Frontend dev:** `http://localhost:5108` với Vite proxy `/kratos/*` → `https://auth.foxia.vn/*`
- **Kratos:** Chạy ở production `https://auth.foxia.vn`
- **Redirect URI:** Phải là URL thực của Kratos (`https://auth.foxia.vn/...`), **KHÔNG PHẢI** localhost URL

**Cấu hình Facebook App cho Dev (với Vite proxy):**

1. Vào Facebook Developer Console
2. Vào Settings > Facebook Login > Settings
3. Thêm redirect URI:
   - **`https://auth.foxia.vn/self-service/methods/oidc/callback/facebook`**
   - ⚠️ **KHÔNG THÊM** `http://localhost:5108/kratos/...` vì đây là Vite proxy URL, không phải URL thực của Kratos

**Giải thích:**

1. User click Facebook login button trên frontend dev (`localhost:5108`)
2. Frontend submit form đến `/kratos/self-service/methods/oidc?flow=...`
3. Vite proxy forward request đến `https://auth.foxia.vn/self-service/methods/oidc?flow=...`
4. Kratos nhận request và tạo redirect URI dựa trên `KRATOS_PUBLIC_URL` (là `https://auth.foxia.vn`)
5. Kratos redirect đến Facebook với redirect_uri: `https://auth.foxia.vn/self-service/methods/oidc/callback/facebook`
6. Facebook authenticate user và redirect về: `https://auth.foxia.vn/self-service/methods/oidc/callback/facebook`
7. Kratos xử lý callback và redirect về frontend: `default_browser_return_url` (có thể là `http://localhost:5108` hoặc `https://auth.foxia.vn`)

**Vậy redirect URI trong Facebook App PHẢI khớp với `KRATOS_PUBLIC_URL`**, không phải frontend URL hay Vite proxy URL.

**Nếu muốn chạy Kratos localhost riêng (không dùng Vite proxy):**

```yaml
serve:
  public:
    base_url: http://localhost:4433/  # Kratos chạy trên localhost:4433
    port: 4433

selfservice:
  default_browser_return_url: http://localhost:5108  # Frontend dev URL
```

Thì redirect URI trong Facebook App sẽ là:
- `http://localhost:4433/self-service/methods/oidc/callback/facebook`

### 7. Testing

#### Test ở Dev:

1. Đảm bảo Kratos dev có:
   - `default_browser_return_url: http://localhost:5108`
   - `flows.error.ui_url: http://localhost:5108/error`
   - `serve.public.base_url: http://localhost:4433/`
   - `cookies.domain`: KHÔNG SET hoặc `localhost`

2. Đảm bảo Facebook App có redirect URI: `http://localhost:4433/self-service/methods/oidc/callback/facebook`

3. Start Kratos: `kratos serve --dev`

4. Start frontend: `cd frontend && yarn dev`

5. Vào `http://localhost:5108/login`

6. Click nút Facebook và test flow

#### Test ở Production:

1. Đảm bảo Kratos production có:
   - `default_browser_return_url: https://auth.foxia.vn/`
   - `flows.error.ui_url: https://auth.foxia.vn/error`
   - `serve.public.base_url: https://auth.foxia.vn/`

2. Đảm bảo Facebook App có redirect URI: `https://auth.foxia.vn/self-service/methods/oidc/callback/facebook`

3. Deploy và test

## Troubleshooting

### Lỗi: "redirect_uri_mismatch" hoặc "URL Blocked - redirect URI is not whitelisted"

- **Nguyên nhân:** Redirect URI trong Facebook App không khớp với redirect URI mà Kratos gửi
- **Cách sửa:**
  1. **Xác định redirect URI mà Kratos đang gửi:**
     - Mở browser DevTools > Network tab
     - Click Facebook login button
     - Tìm request đến `facebook.com/dialog/oauth`
     - Xem query parameter `redirect_uri` trong request đó
     - Đây chính là redirect URI mà Kratos đang gửi đến Facebook
  
  2. **Kiểm tra Kratos config:**
     - Đảm bảo `KRATOS_PUBLIC_URL` hoặc `serve.public.base_url` đúng
     - Redirect URI sẽ là: `<KRATOS_PUBLIC_URL>/self-service/methods/oidc/callback/facebook`
  
  3. **Thêm redirect URI vào Facebook App:**
     - Vào Facebook Developer Console
     - Settings > Facebook Login > Settings
     - Thêm **chính xác** redirect URI (copy từ bước 1) vào "Valid OAuth Redirect URIs"
     - **Lưu ý:** 
       - ❌ KHÔNG dùng frontend URL (`localhost:5108` hoặc `https://auth.foxia.vn`)
       - ❌ KHÔNG dùng Vite proxy URL (`localhost:5108/kratos/...`)
       - ✅ PHẢI dùng Kratos public URL (`https://auth.foxia.vn/self-service/...`)
  
  4. **Với setup Vite proxy hiện tại:**
     - Redirect URI phải là: `https://auth.foxia.vn/self-service/methods/oidc/callback/facebook`
     - Đây là URL thực của Kratos, không phải Vite proxy URL
  
  5. **Format:** `http(s)://<kratos-public-url>/self-service/methods/oidc/callback/facebook`

### Lỗi: "Invalid OAuth access token"

- **Nguyên nhân:** Facebook App Secret không đúng hoặc app chưa được cấu hình đúng
- **Cách sửa:**
  1. Kiểm tra lại App ID và App Secret trong environment variables
  2. Đảm bảo Facebook Login product đã được thêm vào app
  3. Kiểm tra app không ở chế độ Development Mode nếu muốn test với users khác

### Lỗi: "Email not provided"

- **Nguyên nhân:** Facebook không trả về email, có thể do:
  - User chưa verify email trên Facebook
  - App chưa được approve permissions (nếu ở Development Mode)
  - Scope không đúng
- **Cách sửa:**
  1. Đảm bảo scope có `email`
  2. Kiểm tra user đã verify email trên Facebook
  3. Request App Review nếu cần access email của users khác (production)

### Lỗi: CORS

- Kiểm tra CORS config trong Kratos
- Đảm bảo `allowed_origins` bao gồm frontend URL
- Đảm bảo `allow_credentials: true`

### OIDC buttons không hiển thị

- Kiểm tra `selfservice.methods.oidc.enabled: true`
- Kiểm tra provider config đúng và nằm trong `selfservice.methods.oidc.config.providers`
- Kiểm tra Facebook provider có `id: facebook` và `provider: facebook`
- Kiểm tra frontend có render OIDC nodes từ flow không

### Facebook Login Button không xuất hiện trong Test Users

**Lưu ý quan trọng về Facebook App Mode:**

- **Development Mode:** App chỉ có thể được sử dụng bởi:
  - Developers và Testers đã được thêm vào app
  - Test Users được tạo trong app
- **Production Mode:** App có thể được sử dụng bởi bất kỳ user nào (sau khi pass App Review)

**Để test với Test Users:**

1. Vào Facebook Developer Console > Roles > Roles
2. Thêm Test Users: Vào "Test Users" tab > "Add Test Users"
3. Login với Test User để test flow

**Để enable Production Mode:**

1. App phải pass Facebook App Review
2. Vào App Dashboard > App Review
3. Submit app để review các permissions cần thiết (như email)
4. Sau khi approved, app có thể được sử dụng bởi users bất kỳ

## Khác biệt giữa Facebook và Google OIDC

1. **Scope:**
   - Google: `openid`, `email`, `profile`
   - Facebook: `email`, `public_profile`

2. **Email Verified:**
   - Google: Có `email_verified` claim
   - Facebook: Không có `email_verified` claim

3. **Picture Structure:**
   - Google: Direct URL
   - Facebook: Object với structure `{ data: { url: "..." } }`

4. **OIDC Compliance:**
   - Google: Full OIDC compliant
   - Facebook: OAuth 2.0 nhưng không hoàn toàn OIDC (Kratos vẫn hỗ trợ)

## Tham khảo

- [Kratos OIDC Documentation](https://www.ory.sh/docs/kratos/guides/social-sign-in-google-microsoft-github)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [Facebook App Review](https://developers.facebook.com/docs/app-review)

