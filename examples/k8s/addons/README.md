# Kubernetes アドオン（例）

本書の第5章（CNI / MetalLB / Gateway API / Storage）に対応する設定例を配置します。

## 構成

- `cni/`: CNI 導入例（本書は Calico を例示）
- `metallb/`: MetalLB（native/L2）導入例 + IP pool 設定
- `envoy-gateway/`: 新規環境の既定。Envoy Gateway と `GatewayClass` `eg` の導入
- `ingress-nginx/`: 退役済み構成の歴史的参照（明示的 opt-in が必要。Quickstart では使用しない）
- `storage/`: 検証向けストレージの最小例（local-path）

## 実行順序（推奨）

```bash
# 1) CNI（ノードが Ready になるための前提）
bash cni/calico/install.sh

# 2) MetalLB（LoadBalancer を成立させる）
bash metallb/install.sh
kubectl apply -f metallb/ipaddresspool.yaml
kubectl apply -f metallb/l2advertisement.yaml

# 3) Gateway API（Envoy Gateway）
bash envoy-gateway/install.sh

# 4) Storage（local-path）
bash storage/local-path/install.sh
```

注意:

- `metallb/ipaddresspool.yaml` の IP レンジは必ず自環境に合わせて編集してください
- Gateway のデータプレーン Service の外部 IP は MetalLB が割り当てます。`kubectl -n <NS> get gateway` の address を確認してください
- ingress-nginx の installer は移行調査用に限り、`ALLOW_RETIRED_INGRESS_NGINX=1` を明示した場合だけ実行できます

## 関連

- 章: `docs/chapters/chapter-05/`
