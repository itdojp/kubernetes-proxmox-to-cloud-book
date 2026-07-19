---
layout: book
title: "検証済みバージョン一覧（Version Matrix）"
---

# 検証済みバージョン一覧（Version Matrix）

## この章の学習目標（3〜5）

- 本書が想定する検証対象（範囲）を把握できる
- バージョン更新時の方針を理解できる
- 手元の環境差分が「想定内かどうか」を判断する材料を得られる

## 執筆時点 / レビュー時点

- 初版執筆時点: 2026-02-23
- **情報の確認日**: 2026-05-23（Asia/Tokyo）
- Proxmox VE の**確認日時点の現行版**と**本書で検証した版**は、下記の公式情報確認メモで区別する。実機検証の環境条件と証跡がない版は「検証済み」とは扱わない

## 検証対象（執筆時点の例示）

本リポジトリの CI は「Kubernetesクラスタの実機構築」までを自動検証していません。
そのため本章では、次の 2 つを分けて記載します。

- `examples/` が参照する **pinned（固定）版**
- 構築手順が想定する **範囲（例示）**

実機検証を進めた時点で「検証済み（環境条件付き）」として更新します。

## 2026-05-23 公式情報確認メモ

| 項目 | 2026-05-23 時点の確認 | 本書での扱い |
| --- | --- | --- |
| Kubernetes | 公式 Releases では v1.36 系が最新で、サポート対象 minor は v1.36 / v1.35 / v1.34 | 本文の v1.35 例はサポート対象だが、新規構築は作業時点の supported minor と Version Skew Policy を確認する |
| Proxmox VE | **情報の確認日**: 2026-05-23（Asia/Tokyo）。**確認日時点の現行版**: Proxmox VE 9.2（2026-05-21 公開） | **本書で検証した版**: 実機検証した版の記録なし（検証済みとは扱わない）。検証基盤の PVE version、snapshot / SDN / storage 差分を環境メモへ記録する |
| ingress-nginx | 公式告知では best-effort maintenance は 2026年3月まで。その後は release / bugfix / security update が提供されない前提 | 検証例としての利用に限定し、本番では Gateway API または維持される Controller への移行計画を必須にする |

参照:

- [Kubernetes Releases](https://kubernetes.io/releases/)
- [Kubernetes Version Skew Policy](https://kubernetes.io/releases/version-skew-policy/)
- [Proxmox Virtual Environment 9.2 available](https://www.proxmox.com/en/about/company-details/press-releases/proxmox-virtual-environment-9-2)
- [Kubernetes Blog: Ingress NGINX Retirement](https://www.kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/)


| コンポーネント | バージョン（例示/pinned） | 備考 |
| --- | --- | --- |
| Proxmox VE | 環境依存（固定版なし。2026-05-23 確認時点の現行版は 9.2） | **本書で実機検証した版**: 記録なし（検証済みとは扱わない）。3ノード（第3章）。手元の PVE version とストレージ/SDN 差分を記録する |
| Kubernetes | v1.35 系（例） / v1.36 系も確認対象 | kubeadm（第4章）。新規構築時は supported minor と Version Skew Policy を再確認する |
| kubeadm config API | `kubeadm.k8s.io/v1beta4`（例示） | `examples/k8s/bootstrap/kubeadm-init.yaml` |
| containerd | OS 標準（例） | CRI、`SystemdCgroup=true`（第4章） |
| CNI | Calico `v3.31.4`（pinned） | `examples/k8s/addons/cni/calico/install.sh` |
| MetalLB | `v0.15.3`（pinned） | `examples/k8s/addons/metallb/install.sh` |
| Ingress Controller | ingress-nginx `controller-v1.14.3`（pinned / 検証例） | 2026年3月以降は新規 release / bugfix / security update が提供されない前提。本番では Gateway API または維持される Controller への移行計画を必須にする（第5章）。`examples/k8s/addons/ingress-nginx/install.sh` |
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
