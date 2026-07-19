#!/usr/bin/env bash
set -euo pipefail

# ingress-nginx の歴史的な参照例です。Quickstartや新規環境では使用しません。
# 目的: Ingress を用いた HTTP/TLS ルーティングを成立させる。
#
# 注意:
# - ingress-nginx は Retirement（段階的終了）が告知されています（best-effort メンテナンスは 2026年3月まで）
#   - 公式: https://www.kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/
# - 新規環境は examples/k8s/addons/envoy-gateway/install.sh を使用します
# - Service type=LoadBalancer のため、MetalLB と併用します

if [[ "${ALLOW_RETIRED_INGRESS_NGINX:-}" != "1" ]]; then
  cat >&2 <<'EOF'
ingress-nginx is retired and this installer is reference-only.
For the supported Quickstart, run examples/k8s/addons/envoy-gateway/install.sh.
Set ALLOW_RETIRED_INGRESS_NGINX=1 only for an isolated legacy reproduction.
EOF
  exit 1
fi

INGRESS_NGINX_VERSION="${INGRESS_NGINX_VERSION:-controller-v1.14.3}"

kubectl apply -f "https://raw.githubusercontent.com/kubernetes/ingress-nginx/${INGRESS_NGINX_VERSION}/deploy/static/provider/cloud/deploy.yaml"
