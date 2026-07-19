# raw YAML（サンプルアプリ）

## 目的

- Kubernetes の基本動作（Deployment/Service/Gateway/HTTPRoute/ConfigMap）を raw YAML で確認します。
- 後続の Kustomize/Helm 化の前に、「何を差分にすべきか」を明確化します。

## デプロイ

```bash
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f gateway.yaml
kubectl apply -f httproute.yaml
```

## 到達確認（例）

クラスタ内部（Service/Pod）:

```bash
kubectl -n sample-app get deploy,po,svc,gateway,httproute
kubectl -n sample-app logs deploy/sample-app

kubectl -n sample-app port-forward svc/sample-app 18080:80
curl -sS http://127.0.0.1:18080/
```

Gateway API の場合:

- `kubectl -n sample-app get gateway sample-app` の Address を確認します
- 到達確認: `curl -H 'Host: sample-app.local' http://<GATEWAY_ADDRESS>/`
