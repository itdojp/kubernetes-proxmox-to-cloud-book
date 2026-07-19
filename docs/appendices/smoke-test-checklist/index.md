---
layout: book
title: "スモークテストと完了チェックリスト"
---

# スモークテストと完了チェックリスト

## この章の学習目標（3〜5）

- Quickstart 完了後の正常系基準を固定できる
- 検証クラスタと本番クラスタで最低限確認すべき項目を再利用できる
- 問題が出たときに、どの章・付録へ戻るべきか判断できる

## 使いどころ

- Quickstart の Step 9 まで完了し、まず「動いている状態」を固定したいとき
- 第11章/第12章へ進む前に、入口・主要アドオン・サンプルアプリの正常系を再確認したいとき
- 切替前後で、最低限の完了判定を短時間で回したいとき

## 最小スモークテスト（Quickstart 完了後）

| 観点 | 確認コマンド（最小） | 合格条件（例） | 再参照 |
| --- | --- | --- | --- |
| ノード/制御プレーン | `kubectl get nodes -o wide` | 想定 3 ノードが表示され、CNI 導入後は全ノード `Ready` | [第4章](../../chapters/chapter-04/) |
| 主要アドオン | `kubectl get pods -A`<br>`kubectl -n metallb-system get pods`<br>`kubectl -n envoy-gateway-system get pods` | `kube-system` と主要アドオンに `CrashLoopBackOff` がない | [第5章](../../chapters/chapter-05/) |
| 入口（Gateway API） | `kubectl get gatewayclass eg`<br>`kubectl -n sample-app get gateway,httproute` | `GatewayClass` が Accepted、`Gateway` に address があり、`HTTPRoute` が Accepted / ResolvedRefs | [第5章](../../chapters/chapter-05/) |
| サンプルアプリ到達 | `kubectl -n sample-app get deploy,po,svc,gateway,httproute`<br>`curl -sS -H 'Host: sample-app.local' http://<GATEWAY_ADDRESS>/` | `curl` が 200 を返し、本文が確認できる | [第6章](../../chapters/chapter-06/) |

## 完了チェックリスト（検証クラスタ）

### 基盤

- [ ] Proxmox クラスタの quorum が成立し、想定ノード数を維持している
- [ ] VM ネットワークと管理ネットワークの責務分界を説明できる
- [ ] Kubernetes ノードへ SSH でき、再起動後も基本疎通が維持される

### クラスタ/アドオン

- [ ] `containerd` と `kubelet` が全ノードで起動している
- [ ] CNI / MetalLB / Gateway API / Storage の最低限が導入されている
- [ ] `kubectl get events -A --sort-by=.metadata.creationTimestamp | tail -n 50` で致命的な失敗が継続していない

### アプリ/入口

- [ ] sample-app の Deployment/Service/Gateway/HTTPRoute が期待どおり作成されている
- [ ] `curl -H 'Host: sample-app.local'` で到達確認できる
- [ ] 障害切り分けの入口として、`kubectl logs` と `journalctl -u kubelet` をすぐ取得できる

## 切替前後の最小確認（本番クラスタ）

- [ ] 外部依存（DNS/TLS/外部 LB/IAM）の責務分界と変更手順が確定している
- [ ] Secret/認証情報の展開手順があり、監査可能な形で残る
- [ ] 監視/ログ/通知の最低限が成立している
- [ ] ロールバック条件、実行手順、担当者、タイムアウトが明文化されている

## 再参照マップ

- Proxmox/VM 前提を見直す: [第3章](../../chapters/chapter-03/)
- kubeadm/containerd を見直す: [第4章](../../chapters/chapter-04/)
- CNI / MetalLB / Gateway API / Storage を見直す: [第5章](../../chapters/chapter-05/)
- sample-app の正常系を見直す: [第6章](../../chapters/chapter-06/)
- 異常時の切り分けへ進む: [付録：トラブルシューティング](../troubleshooting/)
- 検証対象バージョンを確認する: [付録：検証済みバージョン一覧（Version Matrix）](../version-matrix/)

## まとめ

本付録は、Quickstart の成功体験を「再現できる正常系」に変えるための最小導線です。詳細調査に入る前に、まず本ページで合格条件を固定してください。

## チェックリスト（3〜10）

- [ ] Quickstart 完了後の正常系確認を 1 ページで実施できる
- [ ] 切替前後の最低限の完了判定を説明できる
- [ ] 問題発生時に戻るべき章・付録を判断できる
