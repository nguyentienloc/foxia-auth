# Hướng dẫn cấu hình Hydra với Helm Chart

## Tổng quan

Helm chart của Ory Hydra có thể không hỗ trợ tất cả các config trong file YAML trực tiếp. Một số config như `strategies` và `ttl` cần được set qua environment variables.

## File cấu hình

File mẫu: `backend/config/hydra-helm-values.yaml`

## Cách cấu hình strategies và ttl

### Option 1: Qua hydra.config (nếu Helm chart hỗ trợ)

```yaml
hydra:
  config:
    strategies:
      access_token: jwt
      scope: exact
    ttl:
      access_token: 1h
      refresh_token: 720h
```

### Option 2: Qua Environment Variables (Recommended)

Nếu Helm chart không hỗ trợ trong `hydra.config`, sử dụng `extraEnv`:

```yaml
extraEnv:
  - name: STRATEGIES_ACCESS_TOKEN
    value: "jwt"
  - name: STRATEGIES_SCOPE
    value: "exact"
  - name: TTL_ACCESS_TOKEN
    value: "1h"
  - name: TTL_REFRESH_TOKEN
    value: "720h"
  - name: TTL_ID_TOKEN
    value: "1h"
  - name: TTL_AUTH_CODE
    value: "10m"
```

## Mapping từ YAML config sang Helm values

| YAML Config | Helm Environment Variable | Helm Config Path |
|------------|---------------------------|-----------------|
| `strategies.access_token` | `STRATEGIES_ACCESS_TOKEN` | `hydra.config.strategies.access_token` |
| `strategies.scope` | `STRATEGIES_SCOPE` | `hydra.config.strategies.scope` |
| `strategies.oidc.subject_identifiers.supported_types` | `STRATEGIES_OIDC_SUBJECT_IDENTIFIERS_SUPPORTED_TYPES` | `hydra.config.strategies.oidc.subject_identifiers.supported_types` |
| `strategies.oidc.subject_identifiers.pairwise.salt` | `STRATEGIES_OIDC_SUBJECT_IDENTIFIERS_PAIRWISE_SALT` | Secret |
| `ttl.access_token` | `TTL_ACCESS_TOKEN` | `hydra.config.ttl.access_token` |
| `ttl.refresh_token` | `TTL_REFRESH_TOKEN` | `hydra.config.ttl.refresh_token` |
| `ttl.id_token` | `TTL_ID_TOKEN` | `hydra.config.ttl.id_token` |
| `ttl.auth_code` | `TTL_AUTH_CODE` | `hydra.config.ttl.auth_code` |
| `urls.self.issuer` | `ISSUER_URL` hoặc `URLS_SELF_ISSUER` | `hydra.config.urls.self.issuer` |
| `secrets.system[0]` | `SECRETS_SYSTEM` | Secret |
| `secrets.cookie[0]` | `SECRETS_COOKIE` | Secret |

## Setup hoàn chỉnh

### 1. Tạo Secrets

```bash
# Tạo secret cho Hydra
kubectl create secret generic hydra-secrets \
  --from-literal=system=$(openssl rand -hex 32) \
  --from-literal=cookie=$(openssl rand -hex 32) \
  --from-literal=pairwise=$(openssl rand -hex 32)

# Tạo secret cho database
kubectl create secret generic hydra-db-secret \
  --from-literal=dsn="postgres://user:password@postgres-service:5432/hydra?sslmode=disable"
```

### 2. Deploy với Helm

```bash
# Add Helm repo
helm repo add ory https://k8s.ory.sh/helm/charts
helm repo update

# Install Hydra
helm install hydra ory/hydra \
  -f backend/config/hydra-helm-values.yaml \
  --namespace hydra \
  --create-namespace
```

### 3. Verify

```bash
# Kiểm tra pods
kubectl get pods -n hydra

# Kiểm tra services
kubectl get svc -n hydra

# Kiểm tra ingress
kubectl get ingress -n hydra

# Test discovery endpoint
curl https://oauth.foxia.vn/.well-known/openid-configuration
```

## Cấu hình cho setup hiện tại

Với URLs của bạn:

```yaml
hydra:
  config:
    urls:
      self:
        issuer: https://oauth.foxia.vn
      login: https://auth.foxia.vn/self-service/login/browser
      consent: https://auth.foxia.vn/oauth2/consent
      error: https://auth.foxia.vn/oauth2/error

ingress:
  public:
    hosts:
      - host: oauth.foxia.vn
  admin:
    hosts:
      - host: admin-oauth.foxia.vn
```

## Troubleshooting

### Lỗi: Config không được apply

Nếu `strategies` và `ttl` trong `hydra.config` không hoạt động:

1. Kiểm tra Helm chart version có hỗ trợ không
2. Sử dụng `extraEnv` thay thế
3. Check logs: `kubectl logs -n hydra deployment/hydra`

### Lỗi: Environment variable không được nhận

```bash
# Kiểm tra environment variables trong pod
kubectl exec -n hydra deployment/hydra -- env | grep STRATEGIES
kubectl exec -n hydra deployment/hydra -- env | grep TTL
```

### Lỗi: Secret không tìm thấy

```bash
# Kiểm tra secrets
kubectl get secrets -n hydra

# Verify secret keys
kubectl get secret hydra-secrets -n hydra -o yaml
```

## Best Practices

### 1. Sử dụng Secrets cho sensitive data

```yaml
extraEnv:
  - name: SECRETS_SYSTEM
    valueFrom:
      secretKeyRef:
        name: hydra-secrets
        key: system
```

### 2. Separate values files per environment

```
values-dev.yaml
values-staging.yaml
values-prod.yaml
```

### 3. Validate config trước khi deploy

```bash
helm template hydra ory/hydra -f values.yaml | kubectl apply --dry-run=client -f -
```

## Tài liệu tham khảo

- [Ory Hydra Helm Chart](https://github.com/ory/k8s/tree/master/helm/charts/hydra)
- [Hydra Configuration](https://www.ory.sh/docs/hydra/configuration)

