# raw YAML（サンプルアプリ）

## 目的

- Kubernetes の基本動作（Deployment/Service/Ingress/ConfigMap）を raw YAML で確認します。
- 後続の Kustomize/Helm 化の前に、「何を差分にすべきか」を明確化します。

## デプロイ

```bash
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

Ingress を利用する場合（Ingress Controller 導入済みの場合のみ）:

```bash
kubectl apply -f ingress.yaml
```

## 到達確認（例）

クラスタ内部（Service/Pod）:

```bash
kubectl -n sample-app get deploy,po,svc,ing
kubectl -n sample-app logs deploy/sample-app

kubectl -n sample-app port-forward svc/sample-app 18080:80
curl -sS http://127.0.0.1:18080/
```

Ingress の場合:

- Ingress Controller の外部 IP を確認し、`sample-app.local` を到達できるようにします
- 到達確認: `curl -H 'Host: sample-app.local' http://<INGRESS_EXTERNAL_IP>/`
