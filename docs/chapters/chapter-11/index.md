---
layout: book
title: "第11章：GitOps/CI/CD（検証→本番の流れ）"
---

# 第11章：GitOps/CI/CD（検証→本番の流れ）

## この章の学習目標（3〜5）

- 検証→本番の流れを、GitOps/CI/CD の観点で説明できる
- 差分吸収戦略（環境差分、段階的リリース）を整理できる
- 監査性（変更履歴/承認/ログ）を運用に組み込める

## 「この構成で検証し、本番をクラウドにする」現実性

Proxmox 検証を “現実的” にする条件は次です。

- Git を単一のソースにし、差分を Pull Request で承認できる
- 検証で「本番と同一化できるもの」と「置き換えるもの」を分けて設計する
- 本番の IaC（ネットワーク/IAM/LB/Storage 等）と、Kubernetes 側（アプリ/アドオン）の境界を固定する

逆に、次をやると “余計な手間” になりやすいです。

- 検証でクラウド依存へ寄せすぎる（本番以外で再現できない）
- 検証の都合で手作業が増え、Git に残らない（監査/再現ができない）

## 検証（Proxmox）で “同一化できるもの / できないもの”

### できる（同一化しやすい）

- Namespace 設計、ラベル規約
- RBAC（最低限）
- Deployment 戦略（rolling update、probe、resources）
- アプリ設定（ConfigMap の論理構造）
- Helm release 構造（名前/namespace/values 構成）

### できない（本番で置き換える前提）

- Cloud Load Balancer（検証は MetalLB 等）
- Cloud Storage（検証は local/NFS 等）
- IAM/SSO 統合（検証は最小）
- 監視基盤の一部（組織標準へ統合する部分）

## GitOps（例: Argo CD）で “環境差分を吸収する”

GitOps は「クラスタ外の作業者が kubectl を叩く」のではなく、**クラスタが Git を見て同期する** 方式です。

本書の例（Kustomize overlay を GitOps の同期対象にする）:

- `examples/apps/sample-app/kustomize/overlays/proxmox-dev`
- `examples/apps/sample-app/kustomize/overlays/cloud-prod`

Argo CD Application 例:

```bash
kubectl apply -f examples/gitops/argocd/sample-app-project.yaml
kubectl apply -f examples/gitops/argocd/sample-app-application.yaml
```

注記:

- `repoURL`/`path`/`destination` は環境に合わせて変更してください
- 本番向けは `path` を cloud-prod へ切り替えるか、Application を分けます

## CI/CD（例）: lint → test → build → GitOps 反映

典型のパイプライン例です（組織要件に合わせて最小化します）。

1. PR 作成（アプリ/マニフェスト変更）
2. CI: lint（YAML/Chart）、テスト、セキュリティスキャン
3. image build/push（必要な場合）
4. Chart/package 更新（Helm を採用する場合）
5. GitOps リポジトリ（環境差分）へ反映 → Argo CD/Flux が同期

## 公式ドキュメント（参照）

- Argo CD（公式）: https://argo-cd.readthedocs.io/
- Flux（公式）: https://fluxcd.io/
- GitOps（概念）: https://opengitops.dev/

## まとめ

検証→本番を成立させる鍵は「変更の再現性」と「差分の制御」です。運用フローとして固定します。

## 章末チェックリスト（3〜10）

- [ ] 検証→本番の昇格フローを説明できる
- [ ] 環境差分の管理方法（overlays/values 等）を決めた
- [ ] 監査性（変更履歴/承認/ログ）を意識した運用方針になっている
