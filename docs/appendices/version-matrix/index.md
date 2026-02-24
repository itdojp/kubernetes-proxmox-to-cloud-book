---
layout: book
title: "検証済みバージョン一覧（Version Matrix）"
---

# 検証済みバージョン一覧（Version Matrix）

## この章の学習目標（3〜5）

- 本書が想定する検証対象（範囲）を把握できる
- バージョン更新時の方針を理解できる
- 手元の環境差分が「想定内かどうか」を判断する材料を得られる

## 執筆時点

- 2026-02-23

## 検証対象（執筆時点の例示）

本リポジトリの CI は「Kubernetes クラスタの実機構築」までを自動検証していません。
そのため本章では、次の 2 つを分けて記載します。

- `examples/` が参照する **pinned（固定）版**
- 構築手順が想定する **範囲（例示）**

実機検証を進めた時点で「検証済み（環境条件付き）」として更新します。

| コンポーネント | バージョン（例示/pinned） | 備考 |
| --- | --- | --- |
| Proxmox VE | 環境依存 | 3ノード（第3章） |
| Kubernetes | v1.35 系（例） | kubeadm（第4章） |
| kubeadm config API | `kubeadm.k8s.io/v1beta4`（例示） | `examples/k8s/bootstrap/kubeadm-init.yaml` |
| containerd | OS 標準（例） | CRI、`SystemdCgroup=true`（第4章） |
| CNI | Calico `v3.31.4`（pinned） | `examples/k8s/addons/cni/calico/install.sh` |
| MetalLB | `v0.15.3`（pinned） | `examples/k8s/addons/metallb/install.sh` |
| Ingress Controller | ingress-nginx `controller-v1.14.3`（pinned） | Retirement 告知あり（best-effort は 2026年3月まで）。本番採用判断は要確認（第5章）。`examples/k8s/addons/ingress-nginx/install.sh` |
| Storage | local-path-provisioner `v0.0.34`（pinned） | `examples/k8s/addons/storage/local-path/install.sh` |
| サンプルアプリ | `hashicorp/http-echo:0.2.3`（base）、`latest`（検証例） | `examples/apps/sample-app/` |
| Kustomize | kubectl 組み込み（例） | バージョンは kubectl に依存 |
| Helm | v3 系（例） | 章で取り扱い（第9章〜） |

## 更新方針（ドラフト）

- 原則: 本番利用前は必ず公式ドキュメントとリリースノートを確認する
- マイナー/パッチ更新: 破壊的変更がない範囲で追随（必要なら注意書きを追加）
- メジャー更新: 該当章の見直しと検証を必須とする

## まとめ

Version Matrix は、環境差分の判断基準として維持します。

## チェックリスト（3〜10）

- [ ] 手元の環境が想定とどこで違うかを確認した
- [ ] 本番利用前に公式情報を確認する方針を理解した
- [ ] 更新時の扱い（マイナー/メジャー）を理解した
