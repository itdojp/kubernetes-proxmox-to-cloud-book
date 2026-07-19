# Helm（サンプルアプリ）

## インストール例

```bash
helm upgrade --install sample-app . -n sample-app --create-namespace
```

## values の差分運用（例）

- `values-proxmox-dev.yaml` / `values-cloud-prod.yaml` を用意し、環境差分を values に寄せます。
- Proxmox 検証環境は `GatewayClass` `eg` の Gateway API、cloud-prod はクラウド事業者管理の `IngressClass` `alb` を明示した Ingress を使います。
- `gateway.enabled` と `ingress.enabled` は同時に有効化できません。両方が `true` なら chart はレンダリングを失敗させます。採用クラウドが異なる場合は、`alb` をその環境で監査済みのクラス名へ変更します。

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

cloud-prod の生成物には `ingressClassName: alb` があり、Proxmox 用の生成物には `gatewayClassName: eg` があることを確認してください。`ingress.enabled=true` のとき `className` が空ならレンダリングを失敗させます。
