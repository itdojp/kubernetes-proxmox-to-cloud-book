# Kubernetes ブートストラップ（例）

本書の第4章（kubeadm + containerd）に対応する設定例を配置します。

## 構成

- `modules-k8s.conf`: カーネルモジュール（`overlay`/`br_netfilter`）
- `sysctl-k8s.conf`: sysctl（`ip_forward` 等）
- `kubeadm-init.yaml`: `kubeadm init --config` 用の最小設定例

## 使い方（例）

```bash
# modules/sysctl（全ノード）
sudo cp modules-k8s.conf /etc/modules-load.d/k8s.conf
sudo modprobe overlay
sudo modprobe br_netfilter

sudo cp sysctl-k8s.conf /etc/sysctl.d/99-k8s.conf
sudo sysctl --system
```

control-plane（例）:

```bash
sudo kubeadm init --config kubeadm-init.yaml
```

注意:

- `kubeadm-init.yaml` の IP/hostname 等は必ず自環境に合わせて編集してください
- CNI/MetalLB/Ingress/Storage は `examples/k8s/addons/` へ続きます

## 関連

- 章: `docs/chapters/chapter-04/`

