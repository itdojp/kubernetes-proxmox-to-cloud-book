---
layout: book
title: "第7章：Kustomize 基礎"
---

# 第7章：Kustomize 基礎

## この章の学習目標（3〜5）

- base/overlay の考え方を説明できる
- patch/generator の基本用途を理解できる
- 変更差分を「最小で安全」に表現する方針を持てる

## 扱うトピック（ドラフト）

- base/overlay の構造
- patch（strategic merge / json6902 の考え方）
- generator（ConfigMap/Secret の扱い、再現性）

## まとめ

Kustomize は「差分を小さく保つ」ための道具です。運用に繋がる形で基礎を押さえます。

## 章末チェックリスト（3〜10）

- [ ] base/overlay の役割を説明できる
- [ ] patch/generator の用途を言語化できる
- [ ] 差分管理の方針（どこに差分を寄せるか）を決めた

