---
layout: book
title: "トラブルシューティング"
---

# トラブルシューティング

## この章の学習目標（3〜5）

- 代表的な障害の切り分け観点（ネットワーク/ストレージ/証明書等）を把握できる
- 影響範囲を最小化するための確認順序を理解できる
- 再現性を担保するためのログ・状況記録の取り方を理解できる

## 切り分けの基本方針

1. 影響範囲を確定する（クラスタ全体/特定ノード/特定Namespace）
2. 事実を集める（イベント、ログ、メトリクス）
3. 変更点を確認する（直近のデプロイ/設定変更/アップグレード）
4. 最小修正で切り戻す（安全側へ）

## まず見る最小セット（共通）

```bash
kubectl get nodes -o wide
kubectl get pods -A
kubectl get events -A --sort-by=.metadata.creationTimestamp | tail -n 50
```

ノード側（Linux）:

```bash
sudo journalctl -u kubelet -n 200 --no-pager
sudo systemctl status containerd --no-pager
```

## 症状別：切り分け表（頻出）

### Kubernetes / kubeadm / Node

| 症状 | 確認コマンド（最小） | 典型原因 | 対処（最小） |
| --- | --- | --- | --- |
| `kubectl get nodes` が `NotReady` のまま | `kubectl describe node <NODE>`<br>`kubectl -n kube-system get pods`<br>`journalctl -u kubelet` | CNI 未導入/不整合、`br_netfilter`/sysctl 不足、swap 有効 | CNI を導入（第5章）<br>modules/sysctl/swap を再確認（第4章） |
| `kubeadm init` が失敗する | エラー全文<br>`systemctl status containerd` | swap 有効、containerd 停止、`SystemdCgroup` 不整合、ポート競合 | swap 無効化、containerd 再起動、`SystemdCgroup=true` を確認（第4章） |
| `kubeadm join` が失敗する | `kubeadm token list`（control-plane）<br>疎通: `nc -vz <CP_IP> 6443`（worker） | token 期限切れ、CA hash 不一致、control-plane へ到達できない | `kubeadm token create --print-join-command` を再生成し再実行 |
| Pod が `CrashLoopBackOff` | `kubectl -n <NS> describe pod <POD>`<br>`kubectl -n <NS> logs <POD>` | 設定ミス、イメージ取得失敗、probe 誤設定 | ログ/イベントから原因箇所を最小で修正、まず probe を疑う |
| `ImagePullBackOff` | `kubectl -n <NS> describe pod <POD>` | registry 到達不可、タグ誤り、認証（Secret）不足 | タグ/URL を確認し、必要なら imagePullSecret を設定 |

### CNI / MetalLB / Ingress / Storage

| 症状 | 確認コマンド（最小） | 典型原因 | 対処（最小） |
| --- | --- | --- | --- |
| CNI 導入後も Node が `NotReady` | `kubectl -n kube-system get pods`<br>`kubectl -n kube-system logs ds/calico-node` | `podSubnet` 不一致、iptables/sysctl 不足 | `kubeadm-init.yaml` の `podSubnet` と CNI 設定の整合を確認（第4章/第5章） |
| MetalLB で `EXTERNAL-IP` が付かない（Pending） | `kubectl -n metallb-system get pods`<br>`kubectl describe svc <SVC>` | IP pool 未適用、レンジ衝突、L2 到達性不足（ARP が通らない） | `IPAddressPool/L2Advertisement` を適用、レンジ衝突を解消（第5章、`examples/k8s/addons/metallb/`） |
| Ingress が 404 | `kubectl -n <NS> get ing`<br>`kubectl -n <NS> describe ing <ING>` | Host 不一致、`ingressClassName` 不一致 | `curl -H 'Host: ...'` で Host を合わせる、IngressClass を確認 |
| Ingress が 502/503 | `kubectl -n ingress-nginx logs deploy/ingress-nginx-controller`<br>`kubectl -n <NS> get endpoints <SVC>` | Service selector/port 不一致、Pod が Ready ではない | Service/Deployment の label/selector/port を確認（第6章） |
| PVC が `Pending` | `kubectl get sc`<br>`kubectl -n <NS> describe pvc <PVC>` | StorageClass 未導入、default StorageClass 未設定 | local-path を導入、必要なら default を設定（第5章、`examples/k8s/addons/storage/`） |

### Proxmox / ネットワーク（最低限）

| 症状 | 確認コマンド（最小） | 典型原因 | 対処（最小） |
| --- | --- | --- | --- |
| VM が同一セグメントへ疎通できない | VM: `ip a`/`ip r`/`ping <GW>`<br>PVE: `ip link`/`bridge link` | ブリッジ/ポート設定ミス、VLAN タグ不整合、FW で遮断 | `examples/proxmox/network/interfaces.example` と差分比較し、L2 前提を確認 |
| MetalLB の ARP が効かない | PVE/VM: `tcpdump -i <IF> arp` | VLAN/MTU/フィルタで ARP が落ちる、L2 が分断 | L2 到達性（VLAN/MTU/スイッチ側制御）を確認し、IP pool を見直す |
| Proxmox 側で通信が不安定 | PVE: `pve-firewall status` | Proxmox Firewall などの影響 | まず検証環境では FW 影響を排除し、必要に応じて段階的に有効化する |

## まとめ

トラブルシューティングは「再現性」と「変更点」を起点に進めます。

## チェックリスト（3〜10）

- [ ] 影響範囲（どこまで壊れているか）を言語化した
- [ ] 事実（ログ/イベント/メトリクス）を先に収集した
- [ ] 直近の変更点を確認した
