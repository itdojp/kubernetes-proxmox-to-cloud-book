---
layout: book
title: "第8章：Kustomize 実務"
---

# 第8章：Kustomize 実務

## この章の学習目標（3〜5）

- 環境差分（検証/本番）を overlay として整理できる
- Secret の扱い（漏洩防止/更新/ローテーション）を前提に設計できる
- 運用パターン（ロールバック、差分レビュー）を組み込める

## 前提

- 第7章の Kustomize 構造（base/overlay、patch、generator）を理解している
- 本章で参照するパスは `examples/apps/sample-app/kustomize/` と一致させます

## 検証（Proxmox）overlay と 本番（クラウド）overlay の設計指針

最重要の方針は「base を固定し、差分を最小にする」です。

| 方針 | ねらい | 具体例 |
| --- | --- | --- |
| base は共通（意図を揃える） | デバッグ/レビュー容易性 | Namespace/ラベル、Deployment の構造、probe、Config の論理構造 |
| overlay は環境依存だけを持つ | 移行時の全面修正を防ぐ | replicas/resources、Ingress host、image tag/registry、StorageClass 等 |
| “置き換えポイント” を明示する | 検証→本番を現実的に | MetalLB→Cloud LB、local-path→Cloud CSI（第5章） |

## サンプルアプリで見る「環境差分」の具体例

`examples/apps/sample-app/kustomize/` の overlay 差分は次です。

### proxmox-dev（検証）

- image tag: `latest`（例示。実務では pin 推奨）
- ConfigMap: `TEXT=sample-app (proxmox-dev)`
- Ingress host: `sample-app.local`（base と同一）
- replicas/resources: base を踏襲

適用例:

```bash
kubectl apply -k examples/apps/sample-app/kustomize/overlays/proxmox-dev
```

### cloud-prod（本番）

- replicas: 3（例）
- resources: request/limit を引き上げ（例）
- Ingress host: `sample-app.example.com`（例）
- image tag: base（`0.2.3`）を踏襲（pin）
- ConfigMap: `TEXT=sample-app (cloud-prod)`

適用例:

```bash
kubectl apply -k examples/apps/sample-app/kustomize/overlays/cloud-prod
```

## image tag/registry 差分（現実解）

実務では「本番は pin」「検証は早めに差分を踏む」が基本です。
registry 差分（例: プライベートレジストリへの移行）は、overlay で `images.newName` を差し替えます。

例（概念）:

```yaml
images:
  - name: docker.io/hashicorp/http-echo
    newName: registry.example.com/team/http-echo
    newTag: 0.2.3
```

## Secrets の扱い（Git に平文を置かない）

結論: Kustomize の `secretGenerator` は便利ですが、**Secret 値の取り扱い** を解決しません。
「生成すること」と「保管/配布/監査/ローテーション」は別問題です。

現実解（代表例）:

- 検証（手元）: `kubectl create secret ...` でクラスタに直接投入（値は Git に置かない）
- GitOps（本番）: External Secrets / Sealed Secrets / SOPS などで “Git に秘密が残らない” 形にする
- クラウド本番: クラウド Secret Manager（IAM/監査）を正とし、K8s 側は参照だけに寄せる

## チーム運用（ディレクトリ規約/レビュー観点/アンチパターン）

推奨する運用観点:

- overlay は “環境” に対応させ、増やしすぎない（差分がレビュー不能になる）
- patch は最小（丸ごと置換を避ける）
- レンダリング結果をレビューする（`kubectl kustomize ...`）

アンチパターン例:

- 「とりあえず patch」で差分が散らばり、意図が読めなくなる
- generator に平文 Secret を入れて “Git 管理してしまう”
- 環境差分を base に混ぜ、後から分離できなくなる

## 公式ドキュメント（参照）

- Kustomize（公式）: https://kubectl.docs.kubernetes.io/references/kustomize/
- Kubernetes: Secrets: https://kubernetes.io/docs/concepts/configuration/secret/

## まとめ

実務では「差分を増やさない」「漏洩しない」「戻せる」ことが重要です。Kustomize を運用設計に接続します。

## 章末チェックリスト（3〜10）

- [ ] overlay の粒度（環境差分の単位）を決めた
- [ ] Secret の扱い方針（保存/展開/ローテーション）を決めた
- [ ] ロールバック手順を想定した差分管理になっている
