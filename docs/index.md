---
layout: book
title: "Kubernetes: Proxmox検証からクラウド本番へ"
---

# Kubernetes: Proxmox検証からクラウド本番へ

本書は、Proxmox 上の検証 Kubernetes から、クラウド上の本番 Kubernetes へ移行することを前提に、設計・手順・運用を整理する実務ガイドです。

## 学習成果

- 検証環境（Proxmox）と本番環境（クラウド）の責務分界を説明できる
- 検証→本番で差分が出る箇所（LB/Storage/Identity/Observability 等）を前提に、作業の優先順位を設計できる
- raw YAML / Kustomize / Helm の使い分けを、運用要件（再現性/変更容易性/監査性）から判断できる
- 検証・本番それぞれで破壊的操作のリスクを評価し、実行手順に注意事項を付与できる

## 想定読者

- 検証環境として Proxmox を使い、Kubernetes の学習・検証を行いたい方
- 将来的にクラウド（Managed Kubernetes を含む）へ移行する前提で、手戻りを減らしたい方
- Kustomize / Helm を「実運用の前提」で体系的に整理したい方

## 前提知識

- Linux の基本操作（SSH、ファイル操作、systemd の基本）
- Kubernetes の基礎（Pod/Service/Deployment の概念）
- Git の基本（履歴、差分、ブランチ）

## 所要時間（目安）

- Quickstart（最短ルート）: 2〜6 時間（環境に依存）
- 全章通読 + 検証: 1〜3 週間（並行作業・経験に依存）

## 読み方ガイド

- まず全体像を掴む: 第1章 → 第2章
- 早く成功体験が必要: [Quickstart（最短で成功体験）](introduction/quickstart/)
- まず正常系の確認項目を固定したい: [付録：スモークテストと完了チェックリスト](appendices/smoke-test-checklist/)
- 検証→本番の差分を整理したい: 第2章 → 第11章 → 第12章
- マニフェスト運用（Kustomize/Helm）が主目的: 第6章 → 第7章 → 第8章 → 第9章 → 第10章

Quickstart から入る場合は、次の 3 点だけ先に固定すると迷いにくくなります。

- 開始条件: Proxmox 側で 3 ノード相当の検証ラボを用意し、本リポジトリの `examples/` を参照できる
- 合格条件: sample-app に到達し、[付録：スモークテストと完了チェックリスト](appendices/smoke-test-checklist/) の最小確認を通せる
- 戻り先: バージョン差は [Version Matrix](appendices/version-matrix/)、異常時の初動は [トラブルシューティング](appendices/troubleshooting/) を先に見る

## 安全に使うための注意

本書の手順は、検証環境から本番環境へ移るときの判断材料を整理するためのものであり、そのまま本番へ適用してよいことを保証するものではありません。特に次の点を先に確認してください。

- Proxmox 側の検証では、VM の再作成、ストレージ再初期化、`kubeadm reset` 相当の操作がデータ損失や停止を招く
- クラウド側では、Load Balancer、Block Storage、Identity、監視基盤の仕様差で手順や課金が変わる
- 本番反映前には、etcd backup、マニフェストの差分確認、ロールバック手順、メンテナンス時間帯を先に固定する

検証と本番の差分が気になった場合は、第2章と付録の Version Matrix / トラブルシューティングを先に確認してから本文へ戻ると判断しやすくなります。

## 目次

- 導入
  - [本書の目的と前提](introduction/preface/)
  - [Quickstart（最短で成功体験）](introduction/quickstart/)
  - [読み方ガイド（読者タイプ別）](introduction/reading-guide/)
  - [ライセンスFAQ](introduction/license-faq/)
- 本編
  - [第1章：Proxmox / Podman / Kubernetes の関係俯瞰](chapters/chapter-01/)
  - [第2章：検証→本番を現実的にする設計原則](chapters/chapter-02/)
  - [第3章：Proxmox VE 3ノード検証基盤](chapters/chapter-03/)
  - [第4章：Kubernetesクラスタ構築（kubeadm + containerd）](chapters/chapter-04/)
  - [第5章：追加コンポーネント（CNI / MetalLB / Ingress / Storage）](chapters/chapter-05/)
  - [第6章：サンプルアプリ（raw YAML）で基本動作確認](chapters/chapter-06/)
  - [第7章：Kustomize 基礎](chapters/chapter-07/)
  - [第8章：Kustomize 実務](chapters/chapter-08/)
  - [第9章：Helm 基礎](chapters/chapter-09/)
  - [第10章：Helm運用とアンチパターン](chapters/chapter-10/)
  - [第11章：GitOps/CI/CD（検証→本番の流れ）](chapters/chapter-11/)
  - [第12章：本番運用（監視/ログ/セキュリティ/バックアップ/アップグレード）](chapters/chapter-12/)
- 付録
  - [スモークテストと完了チェックリスト](appendices/smoke-test-checklist/)
  - [検証済みバージョン一覧（Version Matrix）](appendices/version-matrix/)
  - [トラブルシューティング](appendices/troubleshooting/)
  - [用語集](appendices/glossary/)
  - [更新履歴とメンテ方針](appendices/update-notes/)
- あとがき
  - [あとがき](afterword/)
  - [奥付](afterword/colophon/)

## ライセンス

本書は CC BY-NC-SA 4.0 で公開されています。商用利用は別途契約が必要です。

- 詳細: [LICENSE.md](https://github.com/itdojp/kubernetes-proxmox-to-cloud-book/blob/main/LICENSE.md)
- 概要: [ライセンスFAQ](introduction/license-faq/)

## フィードバック

- Issues: [GitHub Issues](https://github.com/itdojp/kubernetes-proxmox-to-cloud-book/issues)

## 利用と更新情報

- 公開版: [GitHub Pages](https://itdojp.github.io/kubernetes-proxmox-to-cloud-book/)
- リポジトリ: [GitHub Repository](https://github.com/itdojp/kubernetes-proxmox-to-cloud-book)
- 版差確認: [コミット履歴](https://github.com/itdojp/kubernetes-proxmox-to-cloud-book/commits/main/) / [Pull Requests](https://github.com/itdojp/kubernetes-proxmox-to-cloud-book/pulls)
- バージョン前提: [付録：検証済みバージョン一覧（Version Matrix）](appendices/version-matrix/)
- 更新方針: [付録：更新履歴とメンテ方針](appendices/update-notes/)

Kubernetes、CNI、CSI、Ingress Controller、クラウド機能の前提は変化します。実運用に適用するときは、本書の記述だけで閉じず、利用中のディストリビューション、クラウド、アドオンの公式 documentation を必ず併読してください。
