---
layout: book
title: "第9章：Helm 基礎"
---

# 第9章：Helm 基礎

## この章の学習目標（3〜5）

- Chart/values/テンプレートの関係を説明できる
- release 管理の考え方を理解できる
- Kustomize と Helm の役割分担の前提を整理できる

## 前提

- 第6章〜第8章のサンプルアプリを理解している（raw YAML → Kustomize）
- 本章で使う Chart は `examples/apps/sample-app/helm/` と一致させます

## Helm の位置づけ（Kustomize との違い）

- Kustomize: 既存 YAML の差分（overlay）を小さく表現する
- Helm: Chart（パッケージ）として再利用し、values でパラメータを与えてリリース管理する

本書は「Kustomize を理解した上で Helm に入る」ことで、テンプレートに依存しないデバッグ力を先に作ります。

## Chart 構成（最小）

`examples/apps/sample-app/helm/` の最小構成です。

- `Chart.yaml`: Chart のメタ情報
- `values.yaml`: デフォルト値（環境差分は別ファイルへ寄せる）
- `templates/`: Kubernetes リソースのテンプレート（Deployment/Service/Ingress/ConfigMap 等）

## values 設計（環境差分の入れどころ）

環境差分は “values の差分” に寄せ、テンプレートの条件分岐を増やしすぎないのが基本です。

本書の例:

- 検証（Proxmox）: `examples/apps/sample-app/helm/values-proxmox-dev.yaml`
- 本番（クラウド）: `examples/apps/sample-app/helm/values-cloud-prod.yaml`

## helm template と helm install/upgrade の使い分け

- `helm template`: レンダリング結果を出力する（レビュー/デバッグ向け。クラスターへ適用しない）
- `helm upgrade --install`: リリースとして適用する（履歴が残る）

例（レンダリング確認）:

```bash
helm template sample-app examples/apps/sample-app/helm -n sample-app -f examples/apps/sample-app/helm/values-cloud-prod.yaml
```

例（インストール/更新）:

```bash
helm upgrade --install sample-app examples/apps/sample-app/helm -n sample-app --create-namespace -f examples/apps/sample-app/helm/values-proxmox-dev.yaml
```

## リリース管理（namespace/history/rollback）

Helm は “リリース” を単位に操作します。

```bash
helm list -n sample-app
helm history sample-app -n sample-app
helm rollback sample-app 1 -n sample-app
```

## 公式ドキュメント（参照）

- Helm（公式）: https://helm.sh/docs/
- Helm: Chart Template Guide: https://helm.sh/docs/chart_template_guide/

## まとめ

Helm は「パッケージ運用」と「リリース管理」をスケールさせるための道具です。基礎を押さえ、運用に繋げます。

## 章末チェックリスト（3〜10）

- [ ] Chart/values/テンプレートの関係を説明できる
- [ ] release の概念（upgrade/rollback）を理解した
- [ ] Kustomize と Helm の役割分担の方針を言語化できる
