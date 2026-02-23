#!/usr/bin/env bash
set -euo pipefail

# ingress-nginx を導入する例です。
# 目的: Ingress を用いた HTTP/TLS ルーティングを成立させる。
#
# 注意:
# - ingress-nginx は Retirement（段階的終了）が告知されています（best-effort メンテナンスは 2026年3月まで）
#   - 公式: https://www.kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/
# - 本書のサンプル（sample-app）は ingressClassName: nginx を前提にしています
# - Service type=LoadBalancer のため、MetalLB と併用します

INGRESS_NGINX_VERSION="${INGRESS_NGINX_VERSION:-controller-v1.14.3}"

kubectl apply -f "https://raw.githubusercontent.com/kubernetes/ingress-nginx/${INGRESS_NGINX_VERSION}/deploy/static/provider/cloud/deploy.yaml"
