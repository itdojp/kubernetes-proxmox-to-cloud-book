---
layout: book
title: "Quickstart（最短で成功体験）"
---

# Quickstart（最短で成功体験）

## この章の学習目標（3〜5）

- 3ノード最小構成の全体像（Proxmox→K8s→アドオン→サンプルアプリ）を把握できる
- 検証環境で「最短で動かす」ための優先順位を説明できる
- 以後の章で詳細化すべきポイントを特定できる

## 方針

Quickstart は「詳細な最適化」よりも「最短での成功体験」を優先します。

- 目的: サンプルアプリをデプロイして到達確認する
- 次段階: 第3章以降で、ネットワーク/ストレージ/運用設計を詰める

## 最短ルート（概要）

1. Proxmox に 3 ノード（VM）を用意する（第3章）
2. kubeadm + containerd でクラスタを構築する（第4章）
3. CNI / LB / Ingress / Storage を導入する（第5章）
4. raw YAML でサンプルアプリをデプロイする（第6章）

## 最小成功パス（コマンド + 合格条件）

注意:

- ここでは “例” として `10.0.10.0/24`（管理）/ `10.0.20.0/24`（VM）を用います。自環境のアドレス設計へ必ず読み替えてください。
- Proxmox/ネットワークは環境差が大きいため、無理に自動化せず「再現可能な最小」を優先します（詳細は第3章）。

### 事前: 本リポジトリの取得（examples を参照するため）

以降のコマンド例は `examples/` 配下のファイルを参照します。作業端末または各ノードで本リポジトリを取得してください。

```bash
git clone https://github.com/itdojp/kubernetes-proxmox-to-cloud-book.git
cd kubernetes-proxmox-to-cloud-book
```

### Step 1. Proxmox クラスタ（3ノード）

Proxmox Node 1（最初の 1 台で実行）:

```bash
sudo pvecm create lab-pve
sudo pvecm status
```

Proxmox Node 2 / 3（Node 1 の管理 IP へ参加）:

```bash
sudo pvecm add 10.0.10.11
sudo pvecm status
```

合格条件（例）:

- `pvecm status` で quorum が成立し、3ノードが見える

### Step 2. Proxmox ネットワーク（管理/VM）

- 管理ネットワーク: Proxmox UI / pvecm（例: `10.0.10.0/24`）
- VM ネットワーク: Kubernetes ノード VM / MetalLB（例: `10.0.20.0/24`）

本書は IP 衝突を避けるため、**VM ネットワーク側の Proxmox ホスト（vmbr1）は IP を持たせない（`inet manual`）** 方針です（第3章）。
設定例は `examples/proxmox/network/interfaces.example` を参照してください。

合格条件（例）:

- Proxmox 管理画面へ到達できる（管理ネットワーク）
- VM を vmbr1 に接続できる（VM ネットワーク）

### Step 3. cloud-init テンプレート作成 → Kubernetes ノード VM 複製

Proxmox ノード上（`qm` 実行可能な環境）:

```bash
bash examples/proxmox/cloud-init/create-ubuntu-template.sh
bash examples/proxmox/cloud-init/clone-k8s-nodes.sh
qm list
```

合格条件（例）:

- `qm list` で `k8s-cp1` / `k8s-w1` / `k8s-w2` が存在する
- VM に SSH ログインできる（鍵/ユーザーは自環境設定）

### Step 4. Kubernetes ノード OS 前提（全ノード）

以降は Kubernetes ノード VM（Linux）上で実行します（例: Ubuntu）。

```bash
# modules/sysctl（全ノード）
sudo cp examples/k8s/bootstrap/modules-k8s.conf /etc/modules-load.d/k8s.conf
sudo modprobe overlay
sudo modprobe br_netfilter

sudo cp examples/k8s/bootstrap/sysctl-k8s.conf /etc/sysctl.d/99-k8s.conf
sudo sysctl --system

# swap（全ノード、破壊的操作）
sudo swapoff -a
sudo sed -i.bak '/\\sswap\\s/s/^/#/' /etc/fstab
```

合格条件（例）:

- `lsmod | egrep 'overlay|br_netfilter'` で有効
- `sysctl net.ipv4.ip_forward` が `1`

### Step 5. containerd + kubeadm（control-plane → worker）

以降は Ubuntu 系を例にします（パッケージ配布は更新されるため、必要に応じて公式ドキュメントを参照してください）。

#### containerd（全ノード）

```bash
sudo apt-get update
sudo apt-get install -y containerd
sudo systemctl enable --now containerd

sudo mkdir -p /etc/containerd
sudo containerd config default | sudo tee /etc/containerd/config.toml >/dev/null
sudo sed -i.bak 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
sudo systemctl restart containerd
```

#### kubeadm/kubelet/kubectl（全ノード）

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

合格条件（例）:

- `systemctl status containerd` が active
- `kubeadm version` が表示される

control-plane（例: `k8s-cp1`）:

```bash
sudo kubeadm init --config examples/k8s/bootstrap/kubeadm-init.yaml

mkdir -p "$HOME/.kube"
sudo cp -i /etc/kubernetes/admin.conf "$HOME/.kube/config"
sudo chown "$(id -u)":"$(id -g)" "$HOME/.kube/config"

kubectl get nodes -o wide
```

worker（例: `k8s-w1` / `k8s-w2`）:

```bash
# control-plane で join コマンドを生成
kubeadm token create --print-join-command

# 出力された join コマンドを worker で実行
sudo kubeadm join <CONTROL_PLANE_IP>:6443 --token <TOKEN> --discovery-token-ca-cert-hash sha256:<HASH>
```

合格条件（例）:

- `kubectl get nodes` で 3 ノードが表示される（CNI 導入前は `NotReady` でもよい）

### Step 6. CNI（Calico）

```bash
bash examples/k8s/addons/cni/calico/install.sh
kubectl get nodes
kubectl get pods -A
```

合格条件（例）:

- `kubectl get nodes` が全ノード `Ready`

### Step 7. MetalLB（Service type=LoadBalancer を成立させる）

```bash
bash examples/k8s/addons/metallb/install.sh
kubectl apply -f examples/k8s/addons/metallb/ipaddresspool.yaml
kubectl apply -f examples/k8s/addons/metallb/l2advertisement.yaml
kubectl -n metallb-system get pods
```

合格条件（例）:

- `metallb-system` の Pod が `Running`

### Step 8. Ingress Controller（ingress-nginx は検証の例示）

```bash
bash examples/k8s/addons/ingress-nginx/install.sh
kubectl -n ingress-nginx get pods
kubectl -n ingress-nginx get svc ingress-nginx-controller
```

合格条件（例）:

- `ingress-nginx-controller` の Service に `EXTERNAL-IP` が付与される（MetalLB の払い出し）

### Step 9. サンプルアプリ（raw YAML）

```bash
kubectl apply -f examples/apps/sample-app/raw-yaml/namespace.yaml
kubectl apply -f examples/apps/sample-app/raw-yaml/configmap.yaml
kubectl apply -f examples/apps/sample-app/raw-yaml/deployment.yaml
kubectl apply -f examples/apps/sample-app/raw-yaml/service.yaml
kubectl apply -f examples/apps/sample-app/raw-yaml/ingress.yaml

kubectl -n sample-app get deploy,po,svc,ing
kubectl -n sample-app logs deploy/sample-app
```

到達確認（Ingress）:

```bash
kubectl -n ingress-nginx get svc ingress-nginx-controller
curl -sS -H 'Host: sample-app.local' http://<INGRESS_EXTERNAL_IP>/
```

合格条件（例）:

- `curl` が 200 を返し、本文が返る（`TEXT` の値が見える）

## 失敗時に見る最小セット（切り分けの入口）

```bash
kubectl get nodes -o wide
kubectl get pods -A
kubectl get events -A --sort-by=.lastTimestamp | tail -n 50

# ノード側（Linux）
sudo journalctl -u kubelet -n 200 --no-pager
sudo systemctl status containerd --no-pager
```

## 破壊的操作に関する注意

クラスタ構築・再構築は破壊的操作を含みます。Quickstart をやり直す場合は、実行前に「影響範囲」と「復旧手段」を確認してください。

## まとめ

Quickstart は「動くところまで」を短く通し、以後の章で設計品質を上げるための入口です。

## チェックリスト（3〜10）

- [ ] 3ノード最小構成の全体像を把握した
- [ ] どの章で何を詳細化するかを理解した
- [ ] 破壊的操作の停止線（検証環境でのみ実行）を確認した
