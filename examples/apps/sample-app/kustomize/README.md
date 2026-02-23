# Kustomize（サンプルアプリ）

## 構成

- `base/`: 共通リソース
- `overlays/proxmox-dev/`: 検証（Proxmox）向け差分
- `overlays/cloud-prod/`: 本番（クラウド）向け差分

`base/` では `configMapGenerator` を使って `sample-app-config` を生成します（環境差分は overlay 側で上書きします）。

## 例（適用）

```bash
kubectl apply -k overlays/proxmox-dev
```

```bash
kubectl apply -k overlays/cloud-prod
```
