#!/usr/bin/env bash
set -euo pipefail

# Envoy Gateway v1.8.x is a supported stable line through 2026-11-14.
# Keep the chart version explicit so the Quickstart never follows a mutable tag.
ENVOY_GATEWAY_VERSION="${ENVOY_GATEWAY_VERSION:-v1.8.0}"

helm upgrade --install eg \
  oci://docker.io/envoyproxy/gateway-helm \
  --version "${ENVOY_GATEWAY_VERSION}" \
  --namespace envoy-gateway-system \
  --create-namespace \
  --wait \
  --timeout 5m

kubectl apply -f "$(dirname "$0")/gatewayclass.yaml"
kubectl wait --for=condition=Accepted gatewayclass/eg --timeout=2m
kubectl -n envoy-gateway-system wait \
  --for=condition=Available deployment/envoy-gateway \
  --timeout=5m
