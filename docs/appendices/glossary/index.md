---
layout: book
title: "用語集"
---

# 用語集

## この章の学習目標（3〜5）

- 本書で頻出する用語の定義を確認できる
- 同義語・誤解しやすい用語を区別できる

## 用語

| 用語 | 定義（本書の文脈） |
| --- | --- |
| Proxmox VE | 検証用の仮想化基盤（Kubernetes の外側） |
| kubeadm | `kubeadm init/join` でクラスタを初期化/参加させるツール |
| control-plane | API Server/Controller/Scheduler など、クラスタを制御するコンポーネント群 |
| etcd | Kubernetes の状態（クラスタデータ）を保持する KVS。バックアップ対象 |
| kubelet | ノード上で Pod を起動/監視するエージェント |
| OCI | コンテナイメージ形式とランタイムの仕様群 |
| CRI | kubelet とコンテナランタイム（containerd 等）間のインターフェース |
| containerd | CRI 経由で Pod を実行するためのコンテナランタイム（ノード側） |
| Podman / Docker | 開発端末/CI でコンテナイメージを build/push するためのツール（本書ではノード runtime としない） |
| CNI | Pod ネットワークの実装を差し込むための仕様（例: Calico/Cilium） |
| Service | Pod への到達性を抽象化する仕組み（selector/port 等） |
| Service: ClusterIP | クラスタ内部の仮想 IP で公開する方式 |
| Service: NodePort | 各ノードのポートで公開する方式 |
| Service: LoadBalancer | 外部 LB と連携して公開する方式（検証: MetalLB / 本番: Cloud LB） |
| MetalLB | オンプレ/検証環境で `Service type=LoadBalancer` を成立させる実装 |
| Ingress | HTTP/TLS ルーティングの宣言（Ingress Controller が必要） |
| IngressClass | どの Controller が Ingress を処理するかを表すクラス |
| Gateway API | Ingress の後継となる L4/L7 ルーティング API 群（実装に依存） |
| CSI | ストレージの実装を差し込むための仕様 |
| PV | 実体ストレージを表すリソース（プロビジョニング結果） |
| PVC | アプリが要求するストレージの宣言（PV の割り当て要求） |
| StorageClass | PV の種別/プロビジョニング方式の定義 |
| RBAC | Kubernetes の認可（Role/RoleBinding など） |
| PSS | Pod Security Standards。Pod の権限/特権利用の基準 |
| GitOps | Git を正としてクラスタ状態を同期する運用モデル（PR で監査/承認） |
| Argo CD | GitOps ツールの一つ。Application で同期対象を定義する |
| Helm | Chart と values によりリリースをパッケージ運用するツール |
| Helm: Chart | 配布単位（テンプレートとメタ情報） |
| Helm: Release | インストール済みの実体（履歴/rollback の単位） |
| Helm: Values | Chart へ与えるパラメータ（環境差分） |
| Kustomize | YAML の差分を base/overlay/patch で表現する仕組み |
| Kustomize: base | 共通リソース（環境に依存しない部分） |
| Kustomize: overlay | 環境差分（検証/本番など） |
| Kustomize: patch | 差分適用（strategic merge / JSON6902 等） |

## まとめ

用語の意味が曖昧なまま進むと、設計判断の前提が崩れます。迷ったらここに戻って確認してください。

## チェックリスト（3〜10）

- [ ] 重要用語（OCI/CRI/kubelet/containerd）を区別できる
- [ ] Service/Ingress/IngressClass の関係を説明できる
- [ ] PV/PVC/StorageClass の関係を説明できる
- [ ] GitOps/Argo CD/Helm/Kustomize の役割分担を言語化できる
