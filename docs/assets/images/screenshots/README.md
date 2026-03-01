# docs/assets/images/screenshots/

本ディレクトリには、本文で参照するスクリーンショットを配置します。

- ルール: `docs/assets/images/README.md`
- 命名: `chXX-<topic>-NN.<ext>`（`<ext>` は `png` または `webp`。例: `ch03-pve-cluster-01.png`）
- 追加時は秘匿情報（IP/ホスト名/トークン等）が残っていないことを目視確認する

## スクリーンショット候補チェックリスト（章別）

本セクションは Issue #14 の候補を、本文ファイル単位で「何を撮るか」「前提状態」を整理したチェックリストです（画像追加は別PRで実施）。

### Introduction / Quickstart（`docs/introduction/quickstart.md`）

前提（例）:
- Proxmox UI にログイン可能
- 検証用 VM（例: `k8s-cp1`/`k8s-w1`/`k8s-w2`）が作成済み
- Kubernetes クラスタ作成済み（例: 3ノード）
- Ingress / サンプルアプリがデプロイ済み

- [ ] Proxmox UI: ログイン後の全体（Datacenter 直下の概要: ノード/リソース）
- [ ] Proxmox UI: VM 一覧（`k8s-cp1`/`k8s-w1`/`k8s-w2` が見える状態）
- [ ] Proxmox UI: VM Summary（IP/ステータス/Console 導線。IP はマスク）
- [ ] Proxmox UI: VM Console（初回起動〜ログインプロンプト）
- [ ] 端末: `pvecm status`（quorum/ノード数）
- [ ] 端末: `qm list`（VM 作成済みの確認）
- [ ] 端末: `kubectl get nodes -o wide`（3ノード確認）
- [ ] 端末: `kubectl -n ingress-nginx get svc ingress-nginx-controller`（EXTERNAL-IP 付与）
- [ ] ブラウザ: サンプルアプリ到達確認（`Host: sample-app.local` のレスポンス）

### 第3章：Proxmox VE 3ノード検証基盤（`docs/chapters/chapter-03/index.md`）

前提（例）:
- Proxmox VE 3ノードクラスタ構成済み
- ブリッジ（例: `vmbr0`/`vmbr1`）やストレージが作成済み

- [ ] Proxmox UI: Datacenter → Cluster（3ノード参加/quorum が見える）
- [ ] Proxmox UI: Node → System → Network（`vmbr0`/`vmbr1` の構成。`vmbr1` が `inet manual` 前提）
- [ ] Proxmox UI: Datacenter → Storage（検証環境のストレージ種別/配置の例）
- [ ] Proxmox UI: VM 作成ウィザード（General/OS/System/Disks/CPU/Memory/Network/Confirm の要点）
- [ ] Proxmox UI: Template 変換（cloud image → template）
- [ ] Proxmox UI: VM → Cloud-Init タブ（ユーザー/SSH key/ipconfig 等。秘匿情報はマスク）
- [ ] Proxmox UI: VM クローン操作（テンプレート → ノード VM 複製）
- [ ] Proxmox UI: Snapshot 作成/復元（検証でのやり直し導線）
- [ ] Proxmox UI: Backup ジョブ設定（スケジュール/保存先の例）
- [ ] Proxmox UI: Restore（復旧の流れが分かる画面）

### 第4章：Kubernetes クラスタ構築（`docs/chapters/chapter-04/index.md`）

前提（例）:
- `kubeadm` / `kubectl` 実行環境があり、Control Plane/Worker に SSH 等でログインできる

- [ ] 端末: `kubeadm init` の主要出力（次アクション: kubeconfig 設定/Pod network/Join）
- [ ] 端末: `kubeadm join` 実行例（トークン/ハッシュはマスク）
- [ ] 端末: `kubectl get nodes`（CNI 導入前後の状態差が分かる）
- [ ] 端末: `systemctl status containerd`（ランタイム稼働の確認）

### 第5章：追加コンポーネント（`docs/chapters/chapter-05/index.md`）

前提（例）:
- CNI（例: Calico）、LB（例: MetalLB）、Ingress Controller、StorageClass などを導入する

- [ ] 端末: Calico 導入後の `kubectl get pods -A`（CNI 成立の確認）
- [ ] 端末: MetalLB の `IPAddressPool`/`L2Advertisement` 適用後の状態（`kubectl -n metallb-system get pods` 等）
- [ ] 端末: Ingress Controller の Service が LoadBalancer になる状態（EXTERNAL-IP）
- [ ] 端末: StorageClass（local-path）が default になっている状態（`kubectl get sc`）

### 第6章：サンプルアプリ（`docs/chapters/chapter-06/index.md`）

前提（例）:
- `sample-app` namespace（または本文で定義する namespace）にリソースを作成済み

- [ ] 端末: `kubectl -n sample-app get deploy,po,svc,ing`（リソース関係の見える化）
- [ ] ブラウザ: サンプルアプリの画面（設定値が反映される）

### 第7章：Kustomize 基礎（`docs/chapters/chapter-07/index.md`）

前提（例）:
- `base` / `overlay` 構成のリポジトリを用意

- [ ] IDE/Editor: `base` と `overlay` のディレクトリ構造（`kustomization.yaml` が分かる）
- [ ] 端末: `kustomize build`（レンダリング結果の確認）

### 第8章：Kustomize 実務（`docs/chapters/chapter-08/index.md`）

前提（例）:
- `proxmox-dev` と `cloud-prod` のような環境差分を overlay で管理している

- [ ] IDE/Editor: `proxmox-dev` と `cloud-prod` の差分（patch/replica/image/IngressClass 等）
- [ ] 端末: `kubectl diff -k`（採用する場合。出力に秘匿情報がないこと）

### 第9章：Helm 基礎（`docs/chapters/chapter-09/index.md`）

前提（例）:
- Helm が利用可能

- [ ] 端末: `helm template`（レンダリングの基本）
- [ ] 端末: `helm install/upgrade` と `helm list`（リリース単位の管理）

### 第10章：Helm 運用（`docs/chapters/chapter-10/index.md`）

前提（例）:
- Helm リリースが存在し、履歴が残っている

- [ ] 端末: `helm history` / `helm rollback`（運用での戻し方）

### 第11章：GitOps/CI/CD（`docs/chapters/chapter-11/index.md`）

前提（例）:
- GitOps ツール（例: Argo CD）が導入済み
- CI（例: GitHub Actions）/Pages デプロイが実行済み

- [ ] Argo CD UI: Applications 一覧（Health/Sync 状態が分かる）
- [ ] Argo CD UI: Application 詳細（Resource tree / Sync 導線）
- [ ] Argo CD UI: Diff 表示（差分のレビュー）
- [ ] Argo CD UI: Sync 実行と結果（履歴/イベント）
- [ ] GitHub UI: Actions の Book QA 成功画面（ワークフロー/ログへの導線）
- [ ] GitHub UI: Pages build and deployment 成功画面（デプロイ完了の確認）

### 第12章：本番運用（`docs/chapters/chapter-12/index.md`）

前提（例）:
- アップグレード手順を実施できる（検証クラスタ/本番クラスタ）
- GitOps UI でヘルスを確認できる

- [ ] 端末: `kubeadm upgrade plan` / `kubeadm upgrade apply` の要点（実施時の確認観点）
- [ ] GitOps UI（採用ツールに応じて）: アップグレード後のヘルス確認
