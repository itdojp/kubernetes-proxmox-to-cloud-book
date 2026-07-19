# Kustomize（サンプルアプリ）

## 構成

- `base/`: 共通リソース
- `overlays/proxmox-dev/`: 検証（Proxmox）向け差分
- `overlays/cloud-prod/`: 本番（クラウド）向け差分

`base/` では `configMapGenerator` を使って `sample-app-config` を生成します（環境差分は overlay 側で上書きします）。外部公開の既定は Gateway API です。

- `base/` / `proxmox-dev`: `GatewayClass` `eg` を使う `Gateway` / `HTTPRoute`
- `cloud-prod`: クラウド事業者が管理する `IngressClass` `alb` を明示した `Ingress`

`cloud-prod` は base の `Gateway` / `HTTPRoute` を削除してから `Ingress` を追加するため、2種類の公開経路が同時に生成されません。実環境では採用クラウドに合わせて `alb` を監査済みのクラス名へ置き換えてください。

## 例（適用）

```bash
kubectl apply -k overlays/proxmox-dev
```

```bash
kubectl apply -k overlays/cloud-prod
```

適用前に生成物を確認します。

```bash
kubectl kustomize overlays/proxmox-dev
kubectl kustomize overlays/cloud-prod
```
