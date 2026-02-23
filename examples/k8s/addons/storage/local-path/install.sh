#!/usr/bin/env bash
set -euo pipefail

# local-path-provisioner を導入する例です。
# 目的: 検証環境で最小限の動く StorageClass を用意する。
#
# 注意:
# - local-path は “ノードに紐づく” ため、本番前提とはズレやすい（第5章で扱う）

LOCAL_PATH_VERSION="${LOCAL_PATH_VERSION:-v0.0.34}"

kubectl apply -f "https://raw.githubusercontent.com/rancher/local-path-provisioner/${LOCAL_PATH_VERSION}/deploy/local-path-storage.yaml"

