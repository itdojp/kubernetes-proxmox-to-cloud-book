---
layout: book
title: "第12章：本番運用（監視/ログ/セキュリティ/バックアップ/アップグレード）"
---

# 第12章：本番運用（監視/ログ/セキュリティ/バックアップ/アップグレード）

## この章の学習目標（3〜5）

- 本番運用で最低限必要な観点（監視/ログ/セキュリティ/バックアップ/更新）を整理できる
- 事故時の復旧設計（RTO/RPO、手順、権限）を前提にできる
- 検証環境で先に確認すべき運用項目を特定できる

## 本番運用の前提（検証段階から決める）

本番運用は「導入したら終わり」ではなく、次を継続する活動です。

- 監視（検知）→ 解析（切り分け）→ 復旧（ロールバック/修復）
- 変更（アップグレード/設定変更）の承認と監査
- セキュリティ（権限/Secret/供給網）の継続的な更新

検証環境（Proxmox）でも、運用の “型” は先に固められます。

## 監視（メトリクス/ログ/トレースの最低限）

最低限の要件（例）:

- メトリクス: Node/Pod/Ingress の基本（CPU/Memory/再起動/レイテンシ）
- アラート: “障害に直結するもの” から始める（ノイズは運用破綻の原因）
- ログ: 収集/保管期間/検索手段/権限制御
- トレース: 必須ではないが、アプリ要件次第で採用（導入コストに注意）

## セキュリティ（最低限）

運用設計に組み込む観点:

- RBAC: 最小権限、Break-glass（緊急時）手順
- Pod Security: 組織標準（PSS）に寄せる（例: baseline/restricted）
- Secret 管理: Git に平文を置かない（第8章/第11章の方針と整合）
- 供給網: image スキャン/署名の方針（導入できる範囲から）

## バックアップ/DR（etcd/PV/アプリデータ）

最低限、次を分離して考えます。

- etcd: クラスタ状態（制御プレーン）のバックアップ
- PV: データ（アプリ状態）のバックアップ
- アプリ: 設定/移行手順（RTO/RPO と整合）

重要: バックアップ “取得” よりも、**復元の訓練**（リストア演習）が本番条件です。

## アップグレード（K8s/アドオン/Helm）

アップグレードは「いつかやる」ではなく、定常運用です。

- Kubernetes: kubeadm/managed の方式に沿う（検証で 1 回は必ず実施）
- アドオン: CNI/Ingress/Storage は互換性を確認し、段階的に更新する
- Helm: release 単位で history/rollback を使える状態にしておく

## “これが揃っていないなら本番にしない” 基準（例）

- 監視（アラート/ログ）と当番/連絡経路が定義されている
- 変更管理（PR 承認/監査/ロールバック）が回る
- Secret の扱いが “組織標準” として決まっている
- バックアップとリストア演習が実施されている
- アップグレード計画（頻度/停止線/責任者）がある

## 公式ドキュメント（参照）

- Kubernetes: Monitoring, Logging, and Debugging: https://kubernetes.io/docs/tasks/debug/
- Kubernetes: RBAC: https://kubernetes.io/docs/reference/access-authn-authz/rbac/
- Kubernetes: Pod Security Standards: https://kubernetes.io/docs/concepts/security/pod-security-standards/
- Kubernetes: Backup（etcd）: https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/
- Helm（rollback 等）: https://helm.sh/docs/intro/using_helm/

## まとめ

運用は「平時の効率」と「有事の復旧」を同時に満たす必要があります。検証段階から運用要件を取り込みます。

## 章末チェックリスト（3〜10）

- [ ] 監視/ログ/セキュリティ/バックアップ/更新の最低要件を整理した
- [ ] 復旧の前提（RTO/RPO、権限、手順）を言語化した
- [ ] バックアップ取得だけでなく、復元（リストア）手順を用意した
- [ ] RBAC/Pod Security/Secret 管理の方針を確定した
- [ ] アップグレードの停止線（誰が/いつ/どこまで戻すか）を決めた
- [ ] 検証環境で先に確認すべき運用項目を特定した
