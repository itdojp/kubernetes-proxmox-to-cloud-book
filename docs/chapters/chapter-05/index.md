---
layout: book
title: "第5章：追加コンポーネント（CNI / MetalLB / Ingress / Storage）"
---

# 第5章：追加コンポーネント（CNI / MetalLB / Ingress / Storage）

## この章の学習目標（3〜5）

- CNI/LB/Ingress/Storage が「検証→本番」で差分要因になる理由を説明できる
- 追加コンポーネントの選定基準（要件/運用/変更容易性）を整理できる
- 検証環境での導入手順を「本番へ移すための形」で記録できる

## 注意（破壊的操作）

ネットワーク/ストレージ系の変更は、クラスタ全体に影響する可能性があります。変更前に影響範囲とロールバック手段を確定してください。

## 前提（第4章の続き）

- `kubeadm init/join` が完了している（ただし CNI 未導入で Node が `NotReady` の状態でもよい）
- 本章で参照するマニフェスト/手順は `examples/k8s/addons/` と一致させます

## この章が「差分要因」になる理由

検証（Proxmox）と本番（クラウド）で差分が出やすいのは、次の 4 領域です。

- CNI: Pod ネットワークの実装（ネットワークポリシー、運用、互換性）
- Load Balancer: `Service type=LoadBalancer` の実体（検証: MetalLB / 本番: Cloud LB）
- Ingress: L7 ルーティング/TLS 終端（コントローラ選定と運用）
- Storage: PV/PVC の裏側（検証: local/NFS 等 / 本番: クラウド CSI）

ここを曖昧にしたままアプリを作ると、移行時に全面修正になります。

## 導入の順序（推奨）

1. CNI（Pod ネットワークが成立しないと node が Ready にならない）
2. MetalLB（検証環境で LoadBalancer を成立させる）
3. Ingress（ingress-nginx 等を外部公開する）
4. Storage（動くが、要件次第で後回しにできる）

## CNI（検証しやすさ/本番互換）

本書では例として Calico を使います（理由: kubeadm との相性、検証の分かりやすさ、NetworkPolicy の扱いやすさ）。
ただし、組織/要件により Cilium 等が適する場合もあります。

インストール例:

```bash
bash examples/k8s/addons/cni/calico/install.sh
```

導入確認:

```bash
kubectl get pods -A
kubectl get nodes
```

## MetalLB（検証環境での LB の位置づけ）

クラウドでは `Service type=LoadBalancer` はクラウド LB が実体になりますが、検証環境（Proxmox）では自前で用意する必要があります。
MetalLB はそのための現実解です。

本書の例は L2 モードを前提にします（BGP はネットワーク要件がある場合に検討します）。

インストール例:

```bash
bash examples/k8s/addons/metallb/install.sh
kubectl apply -f examples/k8s/addons/metallb/ipaddresspool.yaml
kubectl apply -f examples/k8s/addons/metallb/l2advertisement.yaml
```

注意:

- `examples/k8s/addons/metallb/ipaddresspool.yaml` のアドレスレンジは、VM ネットワーク（第3章）の空き帯域へ必ず合わせてください
- 既存の DHCP/静的割り当てと衝突すると、切り分けが困難になります（IP 管理の責務を明確化します）

## Ingress（ingress-nginx と DNS/Host 設計）

アプリを `Ingress` で公開するために、Ingress Controller を導入します。
本書では例として ingress-nginx を使いますが、**ingress-nginx は Retirement（段階的終了）** が告知されています（best-effort メンテナンスは 2026年3月まで）。
そのため、ここでの ingress-nginx は **検証の例示** と位置づけ、本番では組織標準/クラウド標準へ置き換える前提で読み進めてください。

本番の選定観点（例）:

- 運用主体: 誰がアップデート/脆弱性対応を担うか（クラウド/プラットフォーム/アプリチーム）
- セキュリティ: CVE 対応の継続性、マルチテナント前提の安全性
- 互換性: Gateway API 対応/移行方針（Ingress の将来性を含む）
- 観測性: 組織標準の監視/ログ/トレースへ統合できるか

インストール例（Service type=LoadBalancer を前提）:

```bash
bash examples/k8s/addons/ingress-nginx/install.sh
```

外部 IP の確認（MetalLB が割り当てます）:

```bash
kubectl -n ingress-nginx get svc ingress-nginx-controller
```

検証のホスト名（例: `sample-app.local`）は、次のいずれかで解決できるようにします。

- 手元 PC の `/etc/hosts`（最小）
- 検証用 DNS（チーム共有するなら推奨）

## Storage（検証の現実解と、クラウドとの差分）

ストレージは「検証→本番」で最も差分が出やすい領域です。
クラウドでは CSI（例: EBS/EFS 等）が標準ですが、検証環境では以下の現実解が多いです。

- local-path（簡単だが “ノードに紐づく”。本番の前提とズレる）
- NFS（チーム共有・簡易だが、性能/可用性の前提が増える）
- 分散ストレージ（例: Ceph 等。学習コストが高く、本番がクラウドならやりすぎになりやすい）

本書の最小例は local-path provisioner とします。

```bash
bash examples/k8s/addons/storage/local-path/install.sh
```

必要なら StorageClass をデフォルトにします（任意）。

```bash
bash examples/k8s/addons/storage/local-path/set-default-storageclass.sh
```

## “クラウド本番では置き換える箇所” の整理

| 領域 | 検証（Proxmox） | 本番（クラウド） |
| --- | --- | --- |
| LB | MetalLB | Cloud LB |
| Ingress | ingress-nginx（例） | 組織標準（ALB Ingress Controller 等を含む） |
| Storage | local-path/NFS 等 | Cloud CSI（マネージド） |
| Identity | 最小（kubeconfig/ローカル） | IAM/SSO/RBAC 統合 |

## 公式ドキュメント（参照）

- Kubernetes: Cluster Networking (CNI): https://kubernetes.io/docs/concepts/cluster-administration/networking/
- Calico（公式）: https://docs.tigera.io/calico/latest/
- MetalLB（公式）: https://metallb.universe.tf/
- ingress-nginx（公式）: https://kubernetes.github.io/ingress-nginx/
- Kubernetes Blog: Ingress NGINX Retirement: https://www.kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/
- Gateway API（公式）: https://gateway-api.sigs.k8s.io/
- Kubernetes: Ingress: https://kubernetes.io/docs/concepts/services-networking/ingress/
- Kubernetes: Storage: https://kubernetes.io/docs/concepts/storage/

## まとめ

本章は「差分が出るところを先に潰す」ための章です。検証環境でも本番前提の運用を意識します。

## 章末チェックリスト（3〜10）

- [ ] 差分要因（LB/Storage/Ingress）の重要性を説明できる
- [ ] 選定基準（要件/運用/変更容易性）を整理した
- [ ] 変更のロールバック手段を準備した
