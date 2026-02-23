# GitOps リポジトリ構造（例）

書籍の例を “GitOps 運用” として分離する場合の構造例です。

## 例（概念）

```text
repo/
  apps/
    sample-app/
      kustomize/
        base/
        overlays/
          proxmox-dev/
          cloud-prod/
      helm/
        chart/
        values/
  infra/
    ingress/
    monitoring/
    storage/
  environments/
    proxmox-dev/
      apps/
      infra/
    cloud-prod/
      apps/
      infra/
```

ポイント:

- apps と infra を分離し、責務（変更頻度/担当）を分けます
- “環境差分” は environments 配下へ寄せ、昇格（promotion）で差分を最小化します

