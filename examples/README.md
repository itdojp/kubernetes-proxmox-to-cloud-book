# examples/

本ディレクトリは、本書の手順・マニフェスト・設定例を集約するための領域です。

## 実行順序（推奨）

1. `examples/proxmox/`（Proxmox 検証基盤）
2. `examples/k8s/bootstrap/`（kubeadm + containerd）
3. `examples/k8s/addons/`（CNI/LB/Ingress/Storage）
4. `examples/apps/sample-app/`（サンプルアプリ）
5. `examples/gitops/`（GitOps/CI/CD の例）

## 最小実行例（Kubernetes 側）

```bash
# kubeadm init（control-plane）
sudo kubeadm init --config examples/k8s/bootstrap/kubeadm-init.yaml

# CNI/MetalLB/Ingress/Storage
bash examples/k8s/addons/cni/calico/install.sh
bash examples/k8s/addons/metallb/install.sh
kubectl apply -f examples/k8s/addons/metallb/ipaddresspool.yaml
kubectl apply -f examples/k8s/addons/metallb/l2advertisement.yaml
bash examples/k8s/addons/ingress-nginx/install.sh
bash examples/k8s/addons/storage/local-path/install.sh
```

## 注意

- 章で参照するコマンド/パスは、原則として本ディレクトリ配下と一致させます。
- バージョン差分は `docs/appendices/version-matrix/` に集約します。
