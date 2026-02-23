---
layout: book
title: "第4章：Kubernetesクラスタ構築（kubeadm + containerd）"
---

# 第4章：Kubernetesクラスタ構築（kubeadm + containerd）

## この章の学習目標（3〜5）

- kubeadm + containerd によるクラスタ構築の流れを説明できる
- 構築時に発生しやすい前提条件（ネットワーク/証明書/時刻同期等）を把握できる
- 検証→本番で再利用できる設計判断（設定/手順の記録）を整理できる

## 注意（破壊的操作）

クラスタ初期化、ノード再参加、証明書更新などは破壊的操作を含む可能性があります。検証環境でのみ実施し、作業ログを残してください。

## 前提（第3章の続き）

- Proxmox 上に Kubernetes ノード用 VM（control-plane 1 + worker 2）が作成済み
- ノード間の到達性、名前解決、時刻同期が成立している
- 本章のコマンド例は Ubuntu 系を想定します（他ディストリは公式手順に読み替えてください）

章内で参照する設定ファイルは `examples/k8s/bootstrap/` と一致させます。

## OS 前提（共通）

Kubernetes ノードでは最低限、次を満たします。

- swap 無効（kubelet 前提）
- カーネルモジュール（`overlay`/`br_netfilter`）と sysctl（`ip_forward` 等）
- コンテナランタイム（本書は containerd）

設定例:

- `examples/k8s/bootstrap/modules-k8s.conf`
- `examples/k8s/bootstrap/sysctl-k8s.conf`

適用例:

```bash
sudo cp examples/k8s/bootstrap/modules-k8s.conf /etc/modules-load.d/k8s.conf
sudo modprobe overlay
sudo modprobe br_netfilter

sudo cp examples/k8s/bootstrap/sysctl-k8s.conf /etc/sysctl.d/99-k8s.conf
sudo sysctl --system
```

swap 無効化（破壊的操作）:

```bash
sudo swapoff -a
sudo sed -i.bak '/\\sswap\\s/s/^/#/' /etc/fstab
```

## containerd インストールと設定（共通）

インストール（例: Ubuntu）:

```bash
sudo apt-get update
sudo apt-get install -y containerd
sudo systemctl enable --now containerd
```

設定（systemd cgroup を使用）:

```bash
sudo mkdir -p /etc/containerd
sudo containerd config default | sudo tee /etc/containerd/config.toml >/dev/null
sudo sed -i.bak 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
sudo systemctl restart containerd
```

注記:

- containerd の詳細は Kubernetes の container runtime 公式ドキュメントに従ってください（後述リンク参照）
- 以後の章で、`crictl` や `kubectl describe` を使う切り分けを行います

## kubeadm/kubelet/kubectl のインストール（共通）

Kubernetes のパッケージ配布/リポジトリは更新されるため、必ず公式ドキュメントを参照してください。
本書では例として `pkgs.k8s.io` 系を前提にします。

```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gpg

sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.35/deb/Release.key \
  | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.35/deb/ /' \
  | sudo tee /etc/apt/sources.list.d/kubernetes.list >/dev/null

sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```

## kubeadm init（control-plane で実行）

`kubeadm init` は「クラスタの初期化（証明書、マニフェスト生成、kubelet 設定）」を行います。
例として `examples/k8s/bootstrap/kubeadm-init.yaml` を使います（IP 等は環境に合わせて編集してください）。

```bash
sudo kubeadm init --config examples/k8s/bootstrap/kubeadm-init.yaml
```

初期化後、kubectl を操作できるようにします。

```bash
mkdir -p "$HOME/.kube"
sudo cp -i /etc/kubernetes/admin.conf "$HOME/.kube/config"
sudo chown "$(id -u)":"$(id -g)" "$HOME/.kube/config"
```

ここで CNI を入れるまで、Node は `NotReady` のままです（第5章へ続きます）。

## kubeadm join（worker で実行）

control-plane で join コマンドを生成します（トークンは期限があります）。

```bash
kubeadm token create --print-join-command
```

出力された `kubeadm join ...` を worker ノードで実行します。

```bash
sudo kubeadm join <CONTROL_PLANE_IP>:6443 --token <TOKEN> --discovery-token-ca-cert-hash sha256:<HASH>
```

## 確認（最低限）

```bash
kubectl get nodes -o wide
kubectl get pods -A
```

## 検証で必ず 1 回やる：アップグレードの考え方（概要）

検証環境の価値は「アップグレード手順を本番前に固める」ことにもあります。
本書では詳細手順の丸写しではなく、最低限の判断フローを押さえます。

- `kubeadm upgrade plan` で差分確認
- control-plane → worker の順に段階的に更新
- 失敗時のロールバック/停止線（どこまで戻すか）を事前に決める

## 本番で置き換える/追加する箇所

- control-plane HA（外部 LB や複数 control-plane、証明書/トークン運用）
- ノード OS の標準化（組織標準イメージ、脆弱性対応、監査）
- 変更の運用（GitOps/CI/CD。第11章）

## 公式ドキュメント（参照）

- Kubernetes: Installing kubeadm: https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/
- Kubernetes: Creating a cluster with kubeadm: https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/
- Kubernetes: Container runtimes: https://kubernetes.io/docs/setup/production-environment/container-runtimes/
- kubeadm: Upgrade: https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/

## まとめ

本章は「再現可能なクラスタ構築」を目的に、手順と前提条件を整理します。

## 章末チェックリスト（3〜10）

- [ ] kubeadm + containerd の構築手順の全体像を説明できる
- [ ] 破壊的操作の影響範囲と復旧手段を確認した
- [ ] 構築手順（設定/ログ）を再現可能な形で残す方針を決めた
