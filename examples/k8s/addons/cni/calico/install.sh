#!/usr/bin/env bash
set -euo pipefail

# Calico を導入する例です。
# 目的: kubeadm クラスタで Pod ネットワークを成立させ、Node を Ready にする。
#
# 注意:
# - ここでは公式の manifests をそのまま適用します（必要なら別途カスタマイズ）

CALICO_VERSION="${CALICO_VERSION:-v3.31.4}"

kubectl apply -f "https://raw.githubusercontent.com/projectcalico/calico/${CALICO_VERSION}/manifests/calico.yaml"

