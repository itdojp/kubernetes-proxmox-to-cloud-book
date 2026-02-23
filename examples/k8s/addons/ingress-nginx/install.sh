#!/usr/bin/env bash
set -euo pipefail

# ingress-nginx を導入する例です。
# 目的: Ingress を用いた HTTP/TLS ルーティングを成立させる。
#
# 注意:
# - 本書のサンプル（sample-app）は ingressClassName: nginx を前提にしています
# - Service type=LoadBalancer のため、MetalLB と併用します

INGRESS_NGINX_VERSION="${INGRESS_NGINX_VERSION:-controller-v1.14.3}"

kubectl apply -f "https://raw.githubusercontent.com/kubernetes/ingress-nginx/${INGRESS_NGINX_VERSION}/deploy/static/provider/cloud/deploy.yaml"

