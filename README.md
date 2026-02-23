# Kubernetes: Proxmox検証からクラウド本番へ（kubernetes-proxmox-to-cloud-book）

本リポジトリは、Proxmox 上の検証 Kubernetes から、クラウド上の本番 Kubernetes へ移行するための設計・手順・運用を整理する書籍プロジェクトです。公開用サイトは `docs/` を GitHub Pages で配信します。

## 公開URL（GitHub Pages）

- https://itdojp.github.io/kubernetes-proxmox-to-cloud-book/

## 目次

- オンライン版（トップページ）: `docs/index.md`
- 原稿（各章）: `docs/chapters/`

## フィードバック

- Issues: https://github.com/itdojp/kubernetes-proxmox-to-cloud-book/issues

## ローカル開発（前提）

- Node.js（`npm` 実行用）
- Ruby + Bundler（Jekyll 実行用）

## ローカルビルド/プレビュー

```bash
cd docs
bundle install
cd ..

npm run build
npm run dev
```

`npm run dev` は `http://127.0.0.1:4000/` で起動します（`--baseurl ''`）。

## ローカルビルド/プレビュー（Podman）

ローカルに Ruby/Bundler がない場合は、Podman を利用できます。

```bash
npm run build:podman
npm run dev:podman
```

## ライセンス

- `LICENSE.md` / `LICENSE-SCOPE.md` を参照してください。

## シリーズ情報

- シリーズ: https://itdojp.github.io/it-engineer-knowledge-architecture/
- 出版ガイド: https://itdojp.github.io/it-engineer-knowledge-architecture/docs/publishing/
