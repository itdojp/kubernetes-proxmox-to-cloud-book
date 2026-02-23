# Helm（サンプルアプリ）

## インストール例

```bash
helm upgrade --install sample-app . -n sample-app --create-namespace
```

## values の差分運用（例）

- `values-proxmox-dev.yaml` / `values-cloud-prod.yaml` を用意し、環境差分を values に寄せます。

例:

```bash
helm upgrade --install sample-app . -n sample-app --create-namespace -f values-proxmox-dev.yaml
```

```bash
helm upgrade --install sample-app . -n sample-app --create-namespace -f values-cloud-prod.yaml
```

レンダリング結果の確認（レビュー/デバッグ）:

```bash
helm template sample-app . -n sample-app -f values-cloud-prod.yaml
```
