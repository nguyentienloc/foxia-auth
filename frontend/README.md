# Foxia auth playground (frontend)

SPA minh họa cách FE tương tác với `identity-service` thông qua các flow Kratos. Stack:

- **React 19 + Vite + TypeScript**
- **TanStack Query** quản lý kết quả API
- **Axios** (withCredentials) để gọi `identity-service`
- **Zustand** lưu session (identity + session)

## Cấu trúc chính

- `src/api` – lớp gọi HTTP
- `src/core/api/http.ts` – axios instance, đọc `VITE_IDENTITY_API_URL`
- `src/queries` – hook TanStack Query/Muation cho login/registration/logout
- `src/components/flow` – render động `ui.nodes` mà Kratos trả về
- `src/pages` – Login / Registration / Profile (/me) / Logout
- `src/stores/session.store.ts` – store giữ session hiện tại

## Chạy local

```bash
cd frontend
cp env.example .env            # chỉnh VITE_IDENTITY_API_URL nếu cần
yarn install                   # lần đầu
yarn dev                       # chạy http://localhost:5173
```

Các lệnh khác:

```bash
yarn build
yarn preview
yarn lint
```

## Kết nối backend

- `identity-service` phải expose các endpoint `/auth/**` như đã cài đặt.
- FE gửi request với `credentials: 'include'`, nên cần cấu hình CORS + cookie domain đúng ở Kratos & Nest.

## Ghi chú

- Flow hiển thị trực tiếp các field/tin nhắn Kratos trả về (đảm bảo BE forward nguyên `ui.nodes`, `ui.messages`).
- Có thể custom thêm theme bằng cách mở rộng `src/styles/global.css`.
