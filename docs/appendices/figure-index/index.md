---
layout: book
title: "図表索引"
---

# 図表索引

本付録は、本書に掲載する概念図を目的別に探し、図が前提にしている責務分界と確認観点を短時間で再確認するための索引です。掲載対象は本文の静的SVG図5件だけです。

## 図表一覧

| 図表 | 掲載章 | 目的 | 確認・読み取りの観点 |
| --- | --- | --- | --- |
| [図1：責務とデータフロー（概念）](../../chapters/chapter-01/#figure-01-responsibility-flow){: #figure-01-responsibility-flow } | 第1章 | 開発、仮想化基盤、Kubernetesノード、コンテナ実行系の責務を分離する | イメージの登録・取得経路、ProxmoxからVMへの提供境界、control planeからcontainerdまでの実行経路を確認する |
| [図2：アーキテクチャ比較（検証 vs 本番）](../../chapters/chapter-01/#figure-02-lab-production-comparison){: #figure-02-lab-production-comparison } | 第1章 | Proxmox検証で成立させる要素と、クラウド本番で置換する要素を比較する | Load Balancer、Storage、Identityの責務を、検証用アドオンからクラウド標準へ置換する位置を確認する |
| [図3：検証→本番の昇格（promotion）モデル（概念）](../../chapters/chapter-02/#figure-03-promotion-model){: #figure-03-promotion-model } | 第2章 | Pull Requestから検証、観測、手順更新を経た本番反映の停止線を整理する | CI後に検証クラスタで何を確認し、どの時点で本番向け差分を適用するかを確認する |
| [図4：差分吸収（base + overlays / values）（概念）](../../chapters/chapter-02/#figure-04-configuration-differences){: #figure-04-configuration-differences } | 第2章 | 共通定義と検証・本番の環境差分を分離する | base/valuesを共通化し、環境固有値をoverlay/valuesへ閉じ込められているかを確認する |
| [図5：検証環境のレイヤ（概念）](../../chapters/chapter-03/#figure-05-lab-layers){: #figure-05-lab-layers } | 第3章 | 3ノードProxmox検証基盤とKubernetes VMの配置関係を把握する | quorumを前提にしたPVEノードと、control-plane 1・worker 2のVM配置を確認する |

## 利用上の注意

- これらの図は構成・責務の概念を説明するものであり、実環境の台数、IPアドレス、クラウドサービス構成を確定する設計図ではありません。
- 本番へ適用する前には、各クラウド、Kubernetesディストリビューション、アドオンの公式ドキュメントと組織の運用標準を確認してください。

## チェックリスト（3〜10）

- [ ] 必要な図を掲載章と目的から選べる
- [ ] 検証環境と本番環境で置換する責務を説明できる
- [ ] 図を参照して、差分の確認先となる章へ戻れる
