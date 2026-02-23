---
layout: book
title: "第7章：Kustomize 基礎"
---

# 第7章：Kustomize 基礎

## この章の学習目標（3〜5）

- base/overlay の考え方を説明できる
- patch/generator の基本用途を理解できる
- 変更差分を「最小で安全」に表現する方針を持てる

## 前提

- 第6章のサンプルアプリが raw YAML で動作している
- 本章で使うマニフェストは `examples/apps/sample-app/kustomize/` と一致させます

## Kustomize の位置づけ（本書の結論）

Kustomize は「YAML をテンプレート化する」のではなく、**差分（overlay）を最小で安全に表現する** ための仕組みです。

- raw YAML（第6章）で “何がどこに効くか” を理解する
- Kustomize で “環境差分を安全に表現する”
- Helm（第9章〜）で “パッケージ運用とリリース管理をスケールさせる”

## base と overlay

`examples/apps/sample-app/kustomize/` の構造は次です。

- `base/`: 共通（Namespace/Deployment/Service/Ingress 等）
- `overlays/proxmox-dev/`: 検証（Proxmox）向け差分
- `overlays/cloud-prod/`: 本番（クラウド）向け差分

適用例:

```bash
kubectl apply -k examples/apps/sample-app/kustomize/overlays/proxmox-dev
```

```bash
kubectl apply -k examples/apps/sample-app/kustomize/overlays/cloud-prod
```

## patch（strategic merge / json6902）の使い分け

Kustomize の patch は大きく 2 系統あります。

- strategic merge patch: 「YAML の構造」を保ったまま上書きする（Deployment の `replicas`、resources 等に向く）
- JSON6902 patch: 配列要素などを “パス指定” で正確に置換する（Ingress の `rules[0].host` 等に向く）

本書の例:

- strategic merge patch: `examples/apps/sample-app/kustomize/overlays/cloud-prod/patch-replicas.yaml`
- strategic merge patch: `examples/apps/sample-app/kustomize/overlays/cloud-prod/patch-resources.yaml`
- JSON6902 patch: `examples/apps/sample-app/kustomize/overlays/cloud-prod/patch-ingress-host.yaml`

## generator（configMapGenerator/secretGenerator）を “過信しない”

Kustomize の generator は便利ですが、運用上の注意点があります。

- `configMapGenerator` は変更時に名前へハッシュを付け、参照先も更新します（rollout しやすい一方、差分が大きく見える）
- `disableNameSuffixHash: true` は “差分が見やすい” 反面、更新が伝播しない事故の原因になります（採用は要件次第）
- `secretGenerator` に平文を置く設計は避けます（第8章で現実解を整理します）

本書のサンプルは、`base/` で `configMapGenerator` を使い、overlay 側で `behavior: merge` により環境差分を上書きします。

## レンダリング結果の確認（レビュー/デバッグの基本）

差分が正しいかは “適用前に出力を見る” のが基本です。

```bash
kubectl kustomize examples/apps/sample-app/kustomize/overlays/cloud-prod | less
```

## 公式ドキュメント（参照）

- Kustomize（公式）: https://kubectl.docs.kubernetes.io/references/kustomize/
- kubectl apply -k: https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/

## まとめ

Kustomize は「差分を小さく保つ」ための道具です。運用に繋がる形で基礎を押さえます。

## 章末チェックリスト（3〜10）

- [ ] base/overlay の役割を説明できる
- [ ] patch/generator の用途を言語化できる
- [ ] 差分管理の方針（どこに差分を寄せるか）を決めた
