# Hướng dẫn cấu hình Hydra bằng file YAML

## Tổng quan

File này hướng dẫn cách cấu hình Ory Hydra sử dụng file YAML thay vì environment variables.

## File cấu hình mẫu

File mẫu đầy đủ: `backend/config/hydra.config.yml`

## Cách sử dụng

### 1. Tạo file cấu hình

Tạo file `hydra.config.yml` với nội dung từ file mẫu.

### 2. Chạy Hydra với file config

```bash
# Sử dụng file config
hydra serve all --config hydra.config.yml

# Hoặc với Docker
docker run -it --rm \
  -v $(pwd)/hydra.config.yml:/etc/hydra/hydra.config.yml \
  oryd/hydra:v2.2.0 \
  serve all --config /etc/hydra/hydra.config.yml
```

### 3. Hoặc dùng environment variable

```bash
export HYDRA_CONFIG_FILE=/path/to/hydra.config.yml
hydra serve all
```

## Các phần cấu hình quan trọng

### 1. Server Configuration

```yaml
serve:
  public:
    port: 4444
    host: 0.0.0.0
  admin:
    port: 4445
    host: 0.0.0.0
```

### 2. Database

```yaml
dsn: postgres://user:password@host:port/database?sslmode=disable
```

### 3. URLs (Quan trọng nhất)

```yaml
urls:
  self:
    issuer: https://oauth.foxia.vn  # Phải khớp với HYDRA_ISSUER_URL trong Backend
  login: https://auth.foxia.vn/self-service/login/browser
  consent: https://auth.foxia.vn/oauth2/consent
  error: https://auth.foxia.vn/oauth2/error
```

### 4. Secrets

```yaml
secrets:
  system:
    - ${HYDRA_SECRETS_SYSTEM}  # Hoặc hardcode
  cookie:
    - ${HYDRA_SECRETS_COOKIE}  # Hoặc hardcode
```

**Generate secrets:**
```bash
openssl rand -hex 32  # System secret
openssl rand -hex 32  # Cookie secret
openssl rand -hex 32  # Pairwise salt
```

### 5. Strategies

```yaml
strategies:
  access_token: jwt  # jwt hoặc opaque
  scope: exact       # exact hoặc wildcard
  oidc:
    subject_identifiers:
      supported_types:
        - public
        - pairwise
      pairwise:
        salt: ${HYDRA_PAIRWISE_SALT}
```

### 6. Token TTL

```yaml
ttl:
  access_token: 1h
  refresh_token: 720h
  id_token: 1h
  auth_code: 10m
```

## Cấu hình cho setup hiện tại

Dựa trên URLs hiện tại của bạn:

```yaml
urls:
  self:
    issuer: https://oauth.foxia.vn  # Public link của Hydra
  login: https://auth.foxia.vn/self-service/login/browser  # Kratos
  consent: https://auth.foxia.vn/oauth2/consent
  error: https://auth.foxia.vn/oauth2/error
```

## Environment Variables trong YAML

Bạn có thể sử dụng environment variables trong YAML:

```yaml
dsn: postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable
secrets:
  system:
    - ${HYDRA_SECRETS_SYSTEM}
```

Hydra sẽ tự động thay thế các biến môi trường.

## So sánh YAML vs Environment Variables

### YAML (Recommended cho production)

**Ưu điểm:**
- Dễ quản lý và version control
- Cấu trúc rõ ràng, dễ đọc
- Hỗ trợ comments
- Có thể validate syntax

**Nhược điểm:**
- Cần mount file vào container
- Phải quản lý file permissions

### Environment Variables

**Ưu điểm:**
- Dễ dàng với Docker/Kubernetes
- Không cần mount files
- Phù hợp với CI/CD

**Nhược điểm:**
- Khó quản lý khi có nhiều biến
- Không có comments
- Dễ nhầm lẫn

## Best Practices

### 1. Secrets Management

**Không hardcode secrets trong YAML:**

```yaml
# ❌ Không an toàn
secrets:
  system:
    - abc123def456...

# ✅ Sử dụng environment variables
secrets:
  system:
    - ${HYDRA_SECRETS_SYSTEM}
```

### 2. Version Control

**Không commit file có secrets:**

```bash
# .gitignore
hydra.config.yml
hydra.config.local.yml
```

**Tạo file template:**

```bash
hydra.config.yml.template  # Commit file này
hydra.config.yml          # Không commit, chứa secrets thực tế
```

### 3. Validation

**Validate config trước khi deploy:**

```bash
hydra validate config --config hydra.config.yml
```

### 4. Multiple Environments

**Tạo file riêng cho mỗi environment:**

```
hydra.config.dev.yml
hydra.config.staging.yml
hydra.config.prod.yml
```

## Migration từ Environment Variables

Nếu bạn đang dùng environment variables, chuyển sang YAML:

### Bước 1: Tạo file YAML

Sử dụng file mẫu `backend/config/hydra.config.yml`

### Bước 2: Map environment variables

| Environment Variable | YAML Path |
|---------------------|----------|
| `DSN` | `dsn` |
| `ISSUER_URL` | `urls.self.issuer` |
| `SERVE_PUBLIC_PORT` | `serve.public.port` |
| `SERVE_ADMIN_PORT` | `serve.admin.port` |
| `SECRETS_SYSTEM` | `secrets.system[0]` |
| `SECRETS_COOKIE` | `secrets.cookie[0]` |
| `TTL_ACCESS_TOKEN` | `ttl.access_token` |
| `STRATEGIES_ACCESS_TOKEN` | `strategies.access_token` |

### Bước 3: Test

```bash
# Test với file config mới
hydra serve all --config hydra.config.yml --dev
```

## Troubleshooting

### Lỗi: Cannot read config file

```bash
# Kiểm tra file path
ls -la /path/to/hydra.config.yml

# Kiểm tra permissions
chmod 644 hydra.config.yml
```

### Lỗi: Invalid YAML syntax

```bash
# Validate YAML syntax
yamllint hydra.config.yml

# Hoặc online: https://www.yamllint.com/
```

### Lỗi: Environment variable not found

```bash
# Kiểm tra environment variables
env | grep HYDRA

# Hoặc hardcode giá trị trong YAML để test
```

## Cấu hình với Helm Chart

Nếu bạn sử dụng Helm chart trên Kubernetes, một số config như `strategies` và `ttl` có thể không được hỗ trợ trực tiếp trong `hydra.config`. Xem [Hydra Helm Configuration Guide](hydra-helm-configuration.md) để biết cách cấu hình.

## Tài liệu tham khảo

- [Hydra Configuration](https://www.ory.sh/docs/hydra/configuration)
- [Hydra YAML Config Schema](https://github.com/ory/hydra/blob/master/config.yaml)
- [Ory Hydra Helm Chart](https://github.com/ory/k8s/tree/master/helm/charts/hydra)

