---
layout: book
title: "第6章：サンプルアプリ（raw YAML）で基本動作確認"
---

# 第6章：サンプルアプリ（raw YAML）で基本動作確認

## この章の学習目標（3〜5）

- raw YAML によるデプロイで、Kubernetes の基本動作を確認できる
- 以後の Kustomize/Helm 化に向けて、何を抽象化すべきか整理できる
- 検証結果（到達確認/ログ）を再現可能な形で記録できる

## 前提

- Kubernetes クラスタが Ready（第4章）
- CNI/Ingress が導入済み（Ingress を使う場合。第5章）
- 本章で使うマニフェストは `examples/apps/sample-app/raw-yaml/` と一致させます

## サンプルアプリの構成（最小）

本章は「最小で動かす」ために、次のリソースを使います。

| リソース | 役割 | 本書で確認したいこと |
| --- | --- | --- |
| Namespace | 影響範囲の分離 | 以後の運用単位（環境/チーム）を意識する |
| ConfigMap | 設定の外出し | 変更がどこへ効くか（コンテナ引数/ENV） |
| Deployment | Pod の宣言/更新 | rolling update、probe の挙動 |
| Service | 到達性の抽象化 | selector/port の対応関係 |
| Ingress（任意） | 外部公開 | Host/IngressClass/ルーティング |

## デプロイ（raw YAML）

```bash
kubectl apply -f examples/apps/sample-app/raw-yaml/namespace.yaml
kubectl apply -f examples/apps/sample-app/raw-yaml/configmap.yaml
kubectl apply -f examples/apps/sample-app/raw-yaml/deployment.yaml
kubectl apply -f examples/apps/sample-app/raw-yaml/service.yaml
```

Ingress を使う場合（Ingress Controller 導入済みの場合のみ）:

```bash
kubectl apply -f examples/apps/sample-app/raw-yaml/ingress.yaml
```

## 変更点が “どこに効くか” を押さえる

raw YAML は「どの設定がどこに効くか」が 1 対 1 で追えるのが利点です。
最低限、次の対応関係を説明できる状態にします。

| 変更箇所 | 影響 | 典型的な事故 |
| --- | --- | --- |
| `metadata.labels`（Pod） | Service が拾う対象 | selector とズレて到達できない |
| `spec.selector`（Service） | Pod の選別 | “動いているのに繋がらない” |
| `ports`（Service/Pod） | ポート対応 | targetPort のズレで 502/接続失敗 |
| `Ingress.spec.rules.host` | ルーティング | Host 不一致で 404 |
| `readiness/livenessProbe` | 配信可否/再起動 | 誤検知で無限再起動/配信停止 |

## readiness/liveness（最低限）

`examples/apps/sample-app/raw-yaml/deployment.yaml` では最低限の probe を入れています。

- readiness: ルーティング対象に含めてよいか（Service から見えるか）
- liveness: プロセスが生存しているか（再起動すべきか）

検証では、意図的に probe を壊して挙動（イベント/再起動/Ready の変化）を確認してください。

## 動作確認（kubectl/curl）

```bash
kubectl -n sample-app get deploy,po,svc,ing
kubectl -n sample-app describe deploy sample-app
kubectl -n sample-app logs deploy/sample-app
```

Service（ClusterIP）で最短に確認する場合:

```bash
kubectl -n sample-app port-forward svc/sample-app 18080:80
curl -sS http://127.0.0.1:18080/
```

Ingress で確認する場合（例: `sample-app.local`）:

```bash
kubectl -n ingress-nginx get svc ingress-nginx-controller
curl -sS -H 'Host: sample-app.local' http://<INGRESS_EXTERNAL_IP>/
```

## 公式ドキュメント（参照）

- Kubernetes: Deployments: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
- Kubernetes: Service: https://kubernetes.io/docs/concepts/services-networking/service/
- Kubernetes: Ingress: https://kubernetes.io/docs/concepts/services-networking/ingress/
- Kubernetes: ConfigMap: https://kubernetes.io/docs/concepts/configuration/configmap/
- Kubernetes: Probes（readiness/liveness）: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/

## まとめ

本章は、以後の抽象化（Kustomize/Helm）に入る前に「素のKubernetes」の動作を確認します。

## 章末チェックリスト（3〜10）

- [ ] raw YAML でアプリをデプロイできた
- [ ] 到達確認（外部公開/ログ）を実施した
- [ ] 失敗時に確認すべき情報（イベント/ログ）を把握した
