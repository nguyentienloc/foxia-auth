# Luồng Auth SPA dùng Ory Kratos

## Biến môi trường bắt buộc

| Biến | Ý nghĩa |
| ---- | ------- |
| `KRATOS_PUBLIC_URL` | URL public của Kratos (ví dụ: `http://kratos-public:4433`) |
| `KRATOS_TIMEOUT_MS` | (tuỳ chọn) timeout khi gọi Kratos, mặc định `10000` |

## Headers chung cho FE

- FE phải bật `credentials: 'include'` khi gọi API để browser gửi & nhận cookie `ory_kratos_session`.
- Nếu sử dụng session token, gửi thêm header `x-session-token`.

## Endpoint

| Method & Path | Mô tả | Request | Response |
| ------------- | ----- | ------- | -------- |
| `GET /auth/login/browser` | Tạo login flow cho SPA | Query: `returnTo`, `aal`, `refresh` | JSON flow từ Kratos (`ui.nodes`, `messages`, `id`...) |
| `POST /auth/login?flow=<id>` | Submit login flow | Body theo `UpdateLoginFlowBody` (ví dụ: `{ method: 'password', identifier, password, csrf_token }`) | Flow sau khi submit. Response mirror từ Kratos + Set-Cookie forward lại FE |
| `GET /auth/registration/browser` | Tạo registration flow | Query tương tự login | JSON flow từ Kratos |
| `POST /auth/registration?flow=<id>` | Submit registration flow | Body theo `UpdateRegistrationFlowBody` (traits, password, method, csrf, ...) | Flow/identity mới + cookie session |
| `GET /auth/me` | Lấy session hiện tại | Yêu cầu cookie session hợp lệ. Dùng `KratosSessionGuard` | `{ identity, session }` |
| `GET /auth/logout/browser` | Tạo logout flow / logout URL | Query: `returnTo` | Flow chứa `logout_token`, `logout_url` |
| `POST /auth/logout` | Thực thi logout | Body: `{ logout_token }` | Flow logout + cookie clear |

### Thông điệp lỗi

- Service forward nguyên `data` từ Kratos (kể cả `ui.messages`, `ui.nodes[].messages`) trong `BadRequestException`.
- FE nên đọc `response.data.ui.messages` để render lỗi form.

## Guard & Request context

- Sử dụng `KratosSessionGuard` (trong `core/auth/guards/kratos-session.guard`) để bảo vệ API.
- Guard gọi `toSession()` bằng cookie/x-session-token và gắn:
  - `request.kratosSession`: object `Session` của Kratos.
  - `request.user`: `{ id, identity, traits, session }`.
- Các decorator `@User()` hiện có vẫn lấy được thông tin identity/traits.

## FE usage tips

1. **Khởi tạo flow**: gọi endpoint `/auth/{login|registration}/browser`, render form dựa trên `ui.nodes`.
2. **Submit flow**: gửi nguyên payload NestJS yêu cầu. Nếu Kratos trả lỗi validation, service trả về cùng structure => FE hiển thị trực tiếp.
3. **Giữ cookie**: mọi fetch cần `credentials: 'include'`. Không lưu JWT.
4. **Logout**: 
   - `GET /auth/logout/browser` để lấy `logout_token` hoặc `logout_url`.
   - `POST /auth/logout` với `{ logout_token }` sẽ clear session cookie từ phía server, nên FE chỉ cần xoá local storage phụ (nếu có).

