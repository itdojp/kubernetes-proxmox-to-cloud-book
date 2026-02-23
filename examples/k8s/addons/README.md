# Kubernetes アドオン（例）

本書の第5章（CNI / MetalLB / Ingress / Storage）に対応する設定例を配置します。

## 構成

- `cni/`: CNI 導入例（本書は Calico を例示）
- `metallb/`: MetalLB（native/L2）導入例 + IP pool 設定
- `ingress-nginx/`: ingress-nginx 導入例（Service type=LoadBalancer 前提）
- `storage/`: 検証向けストレージの最小例（local-path）

## 実行順序（推奨）

```bash
# 1) CNI（ノードが Ready になるための前提）
bash cni/calico/install.sh

# 2) MetalLB（LoadBalancer を成立させる）
bash metallb/install.sh
kubectl apply -f metallb/ipaddresspool.yaml
kubectl apply -f metallb/l2advertisement.yaml

# 3) Ingress（ingress-nginx）
bash ingress-nginx/install.sh

# 4) Storage（local-path）
bash storage/local-path/install.sh
```

注意:

- `metallb/ipaddresspool.yaml` の IP レンジは必ず自環境に合わせて編集してください
- Ingress の外部 IP は MetalLB が割り当てます（`kubectl -n ingress-nginx get svc`）

## 関連

- 章: `docs/chapters/chapter-05/`

