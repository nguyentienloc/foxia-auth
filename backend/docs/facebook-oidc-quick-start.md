# Hướng dẫn nhanh: Thêm đăng nhập Facebook

File này tóm tắt các bước cần thực hiện để thêm đăng nhập Facebook vào hệ thống.

## Các file cấu hình cần sửa

### 1. Kratos Configuration File (`kratos.yml`)

**Vị trí:** File này thường nằm trong deployment/infrastructure (có thể không có trong repo)

**Thay đổi:** Thêm Facebook provider vào section `selfservice.methods.oidc.config.providers`:

```yaml
selfservice:
  methods:
    oidc:
      enabled: true
      config:
        providers:
          # Google (đã có)
          - id: google
            provider: google
            # ... existing config ...
          
          # Facebook (THÊM MỚI)
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

### 2. Environment Variables

**Vị trí:** File `.env` hoặc environment variables trong deployment (Kubernetes ConfigMap, Docker Compose, etc.)

**Thêm các biến mới:**

```bash
# Facebook OAuth Credentials
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
```

### 3. Facebook Developer Console

**Không phải file trong repo, nhưng cần cấu hình:**

1. Tạo Facebook App tại https://developers.facebook.com/
2. Thêm Facebook Login product
3. Cấu hình Redirect URI:
   - Production: `https://auth.foxia.vn/self-service/methods/oidc/callback/facebook`
   - Dev: `http://localhost:4433/self-service/methods/oidc/callback/facebook`
4. Lấy App ID và App Secret

## Checklist

- [ ] Thêm Facebook provider vào `kratos.yml`
- [ ] Thêm `FACEBOOK_CLIENT_ID` vào environment variables
- [ ] Thêm `FACEBOOK_CLIENT_SECRET` vào environment variables
- [ ] Tạo Facebook App trong Facebook Developer Console
- [ ] Cấu hình Redirect URI trong Facebook App
- [ ] Restart Kratos service để load config mới
- [ ] Test đăng nhập Facebook ở dev environment
- [ ] Test đăng nhập Facebook ở production environment

## Lưu ý quan trọng

1. **Redirect URI:** Phải khớp chính xác với Kratos public URL
2. **Facebook App Mode:** Development mode chỉ cho phép test users và developers
3. **Email Permission:** Cần request App Review nếu muốn access email của users khác (production)
4. **Mapper:** Đã được encode base64 sẵn, không cần thay đổi trừ khi muốn customize

## Xem chi tiết

Xem file `kratos-facebook-oidc-config.md` để biết chi tiết về:
- Cấu hình đầy đủ
- Mapper configuration
- Troubleshooting
- Testing procedures

## Frontend

**KHÔNG CẦN THAY ĐỔI CODE FRONTEND!**

Frontend đã tự động render tất cả OIDC providers từ Kratos flow. Nếu Facebook provider được cấu hình đúng trong Kratos, nút Facebook sẽ tự động xuất hiện trên login/registration page.

