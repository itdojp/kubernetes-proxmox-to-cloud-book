# Proxmox 検証基盤（例）

本書の第3章（Proxmox VE 3ノード検証基盤）に対応する設定例を配置します。

## 構成

- `network/`: Proxmox ノード側のネットワーク設定例（Linux bridge）
- `cloud-init/`: Ubuntu cloud image をテンプレート化し、K8s ノード VM を複製する例

## 使い方（例）

### 1) ネットワーク例（Linux bridge）

`/etc/network/interfaces` の例は `network/interfaces.example` を参照してください。

注意:

- NIC 名（例: `enp1s0`）は環境差があります
- VLAN を使う場合は、ブリッジのポートに VLAN IF（例: `enp1s0.20`）を割り当てます

### 2) cloud-init テンプレート例（Proxmox CLI）

テンプレート作成:

```bash
bash cloud-init/create-ubuntu-template.sh
```

K8s ノード VM の複製（control-plane 1 + worker 2 の例）:

```bash
bash cloud-init/clone-k8s-nodes.sh
```

注意:

- VMID/ブリッジ名/IP アドレスは必ず自環境に合わせて編集してください
- 破壊的操作を含むため、検証環境でのみ実施してください

## 関連

- 章: `docs/chapters/chapter-03/`
