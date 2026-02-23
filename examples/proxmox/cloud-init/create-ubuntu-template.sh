#!/usr/bin/env bash
set -euo pipefail

# Proxmox VE 上で Ubuntu の cloud image をテンプレート化する例です。
# 目的: 「同じ条件の VM を作り直せる」状態を作る（検証環境の回転数を上げる）。
#
# 注意:
# - 破壊的操作を含むため、検証環境でのみ実行してください
# - STORAGE/BRIDGE/NODE の構成は環境で異なります

TEMPLATE_ID="${TEMPLATE_ID:-9000}"
TEMPLATE_NAME="${TEMPLATE_NAME:-ubuntu-2404-cloudinit}"

STORAGE="${STORAGE:-local-lvm}"
BRIDGE="${BRIDGE:-vmbr1}"

IMG_FILE="${IMG_FILE:-ubuntu-24.04-server-cloudimg-amd64.img}"
IMG_URL="${IMG_URL:-https://cloud-images.ubuntu.com/releases/24.04/release/ubuntu-24.04-server-cloudimg-amd64.img}"

echo "[INFO] Download cloud image: ${IMG_URL}"
curl -fsSL -o "${IMG_FILE}" "${IMG_URL}"

echo "[INFO] Create VM: ${TEMPLATE_ID} (${TEMPLATE_NAME})"
qm create "${TEMPLATE_ID}" \
  --name "${TEMPLATE_NAME}" \
  --memory 2048 \
  --cores 2 \
  --net0 "virtio,bridge=${BRIDGE}" \
  --scsihw virtio-scsi-pci

echo "[INFO] Import disk to storage: ${STORAGE}"
qm importdisk "${TEMPLATE_ID}" "${IMG_FILE}" "${STORAGE}"

echo "[INFO] Attach disk + enable cloud-init"
qm set "${TEMPLATE_ID}" \
  --scsi0 "${STORAGE}:vm-${TEMPLATE_ID}-disk-0" \
  --ide2 "${STORAGE}:cloudinit" \
  --boot c \
  --bootdisk scsi0 \
  --serial0 socket \
  --vga serial0 \
  --agent enabled=1

echo "[INFO] Convert to template"
qm template "${TEMPLATE_ID}"

echo "[INFO] Done. Next: clone VMs with cloud-init settings."

