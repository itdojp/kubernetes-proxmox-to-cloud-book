#!/usr/bin/env bash
set -euo pipefail

# MetalLB（native mode）を導入する例です。
# 目的: 検証環境（Proxmox）で Service type=LoadBalancer を成立させる。
#
# 注意:
# - IPAddressPool/L2Advertisement は別ファイルで適用します

METALLB_VERSION="${METALLB_VERSION:-v0.15.3}"

kubectl apply -f "https://raw.githubusercontent.com/metallb/metallb/${METALLB_VERSION}/config/manifests/metallb-native.yaml"

