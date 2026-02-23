# Helm（サンプルアプリ）

## インストール例

```bash
helm install sample-app . -n sample-app --create-namespace
```

## values の差分運用（例）

- `values-dev.yaml` / `values-prod.yaml` を用意し、環境差分を values に寄せます。

