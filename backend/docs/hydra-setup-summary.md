# Hydra OIDC Integration - Setup Summary

## Tổng quan

Backend đã được tích hợp với Ory Hydra để làm OIDC/OAuth2 authorization server, sử dụng Kratos làm identity provider.

## Files đã được tạo

### Core Providers
- `backend/core/auth/providers/hydra.provider.ts` - Hydra AdminApi và PublicApi providers

### OAuth2 Module
- `backend/apps/identity-service/src/modules/oauth2/oauth2.module.ts` - OAuth2 module
- `backend/apps/identity-service/src/modules/oauth2/services/oauth2.service.ts` - OAuth2 service
- `backend/apps/identity-service/src/modules/oauth2/services/hydra-kratos-integration.service.ts` - Integration service
- `backend/apps/identity-service/src/modules/oauth2/controllers/oauth2.controller.ts` - OAuth2 endpoints

### DTOs
- `backend/apps/identity-service/src/modules/oauth2/dtos/client-credentials.dto.ts`
- `backend/apps/identity-service/src/modules/oauth2/dtos/create-client.dto.ts`
- `backend/apps/identity-service/src/modules/oauth2/dtos/token-response.dto.ts`

### Guards & Decorators
- `backend/core/auth/guards/oauth2-token.guard.ts` - Guard để validate OAuth2 tokens
- `backend/core/auth/decorators/oauth2-client.decorator.ts` - Decorator để inject OAuth2 client info

### Documentation
- `backend/docs/hydra-configuration.md` - Hướng dẫn cấu hình Hydra
- `backend/docs/hydra-client-credentials-flow.md` - Hướng dẫn sử dụng Client Credentials Flow

## Files đã được cập nhật

- `backend/package.json` - Thêm `@ory/hydra-client` dependency
- `backend/apps/identity-service/src/app.module.ts` - Import OAuth2Module
- `backend/core/auth/auth.module.ts` - Export Hydra providers
- `backend/README.md` - Thêm thông tin về OAuth2 endpoints

## Environment Variables cần thiết

Thêm các biến sau vào file `.env`:

```bash
# Kratos Configuration (Identity Provider)
KRATOS_PUBLIC_URL=http://kratos-public:4433

# Hydra Configuration (OAuth2/OIDC Authorization Server)
HYDRA_ADMIN_URL=http://localhost:4445
HYDRA_PUBLIC_URL=http://localhost:4444
HYDRA_ISSUER_URL=https://auth.foxia.vn  # Public URL cho client applications
HYDRA_TIMEOUT_MS=10000
```

**Lưu ý**: 
- `KRATOS_PUBLIC_URL`: URL của Kratos server (identity provider)
- `HYDRA_ISSUER_URL`: Public URL của Hydra mà client applications sẽ sử dụng (không phải URL của Kratos)
- `HYDRA_PUBLIC_URL`: Internal URL của Hydra để backend gọi API

## Cài đặt Dependencies

```bash
cd backend
yarn install
```

Package `@ory/hydra-client` sẽ được cài đặt tự động.

## OAuth2 Endpoints

Sau khi start backend, các endpoints sau sẽ available:

- `POST /oauth2/token` - Token endpoint (Client Credentials Flow)
- `GET /oauth2/.well-known/openid-configuration` - OIDC Discovery
- `GET /oauth2/jwks` - JSON Web Key Set
- `POST /oauth2/clients` - Tạo OAuth2 client (Admin)
- `GET /oauth2/clients` - List OAuth2 clients (Admin)
- `GET /oauth2/clients/:id` - Get OAuth2 client (Admin)
- `DELETE /oauth2/clients/:id` - Delete OAuth2 client (Admin)

## Sử dụng OAuth2 Guard

Để bảo vệ API endpoints với OAuth2 token:

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

## Next Steps

1. **Cấu hình Hydra Server**: Xem `docs/hydra-configuration.md`
2. **Tạo OAuth2 Client**: Sử dụng `POST /oauth2/clients` endpoint
3. **Test Client Credentials Flow**: Xem `docs/hydra-client-credentials-flow.md`
4. **Bảo vệ API endpoints**: Sử dụng `OAuth2TokenGuard`

## Lưu ý

- Hydra server phải được deploy và running trước khi backend start
- Đảm bảo Hydra database đã được migrate
- Generate secrets cho Hydra (xem `docs/hydra-configuration.md`)
- Cấu hình CORS nếu cần thiết

