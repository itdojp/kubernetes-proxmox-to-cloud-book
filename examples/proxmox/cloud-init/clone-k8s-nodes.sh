#!/usr/bin/env bash
set -euo pipefail

# cloud-init テンプレートから Kubernetes ノード VM を複製する例です。
#
# 注意:
# - VMID/IP/ゲートウェイ等は必ず自環境に合わせて変更してください
# - 実行は Proxmox ノード上（qm が使える環境）を前提にします

TEMPLATE_ID="${TEMPLATE_ID:-9000}"
BRIDGE="${BRIDGE:-vmbr1}"

# SSH 公開鍵ファイル（例: Proxmox ノード上の鍵。適宜変更）
SSH_KEYS_FILE="${SSH_KEYS_FILE:-$HOME/.ssh/authorized_keys}"

clone_vm() {
  local vmid="$1"
  local name="$2"
  local ip_cidr="$3"
  local gw="$4"
  local cores="$5"
  local mem_mb="$6"

  echo "[INFO] Clone ${name} (${vmid}) from template ${TEMPLATE_ID}"
  qm clone "${TEMPLATE_ID}" "${vmid}" --name "${name}" --full 1

  qm set "${vmid}" \
    --cores "${cores}" \
    --memory "${mem_mb}" \
    --net0 "virtio,bridge=${BRIDGE}" \
    --ipconfig0 "ip=${ip_cidr},gw=${gw}" \
    --sshkeys "${SSH_KEYS_FILE}" \
    --agent enabled=1
}

# 例: VM ネットワーク（10.0.20.0/24）に配置する想定
GATEWAY="${GATEWAY:-10.0.20.1}"

clone_vm 101 k8s-cp1 "10.0.20.11/24" "${GATEWAY}" 4 8192
clone_vm 102 k8s-w1  "10.0.20.21/24" "${GATEWAY}" 4 8192
clone_vm 103 k8s-w2  "10.0.20.22/24" "${GATEWAY}" 4 8192

echo "[INFO] Done. Start VMs and complete OS bootstrap."

