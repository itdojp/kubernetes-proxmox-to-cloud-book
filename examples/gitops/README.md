# GitOps（例）

本書の第11章（GitOps/CI/CD）に対応する例を配置します。

## 構成

- `argocd/`: Argo CD の例（AppProject/Application）
- `repo-layout.example.md`: GitOps リポジトリのディレクトリ構造例

## 使い方（例: Argo CD）

前提:

- Argo CD がクラスタに導入済み
- namespace `argocd` が存在する

適用例:

```bash
kubectl apply -f examples/gitops/argocd/sample-app-project.yaml
kubectl apply -f examples/gitops/argocd/sample-app-application.yaml
```

本番（cloud-prod）例は `examples/gitops/argocd/sample-app-cloud-prod.yaml` を参照してください。

