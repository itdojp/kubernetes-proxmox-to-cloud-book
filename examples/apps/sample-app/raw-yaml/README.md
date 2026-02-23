# raw YAML（サンプルアプリ）

## 目的

- Kubernetes の基本動作（Deployment/Service/Ingress）を raw YAML で確認します。
- 後続の Kustomize/Helm 化の前に、「何を差分にすべきか」を明確化します。

## デプロイ

```bash
kubectl apply -f namespace.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

Ingress を利用する場合（Ingress Controller 導入済みの場合のみ）:

```bash
kubectl apply -f ingress.yaml
```

## 到達確認（例）

- ClusterIP の場合: `kubectl port-forward` を利用
- LoadBalancer/Ingress の場合: 環境の到達方式（MetalLB/クラウドLB 等）に従う

