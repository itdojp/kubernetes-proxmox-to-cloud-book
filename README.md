# Kubernetes: Proxmox検証からクラウド本番へ（kubernetes-proxmox-to-cloud-book）

本リポジトリは、Proxmox 上の検証 Kubernetes から、
クラウド上の本番 Kubernetes へ移行するための設計・手順・運用を整理する書籍プロジェクトです。
公開用サイトは `docs/` を GitHub Pages で配信します。

## 公開URL（GitHub Pages）

- [Kubernetes: Proxmox検証からクラウド本番へ](https://itdojp.github.io/kubernetes-proxmox-to-cloud-book/)

## 目次

- オンライン版（トップページ）: `docs/index.md`
- 原稿（各章）: `docs/chapters/`

## フィードバック

- Issues: [itdojp/kubernetes-proxmox-to-cloud-book の Issues](https://github.com/itdojp/kubernetes-proxmox-to-cloud-book/issues)

## ローカル開発（前提）

- Node.js 20+（`npm` 実行用。CI は Node.js 20 を使用）
- Ruby + Bundler（Jekyll 実行用）

## ローカルビルド/プレビュー

```bash
npm ci

cd docs
bundle install
cd ..

npm run build
npm run dev
```

`npm run dev` は `http://127.0.0.1:4000/` で起動します（`--baseurl ''`）。

## 品質確認

`book-config.json` を正本として、npm パッケージ情報、Jekyll 設定、トップページの
front matter、ナビゲーション、公開アセットの整合性を確認します。

```bash
npm run check:security
npm run check:metadata
npm run check:introduction-appendix-links
npm test
```

`check:introduction-appendix-links` は、導入3ページから付録への7リンクについて、source route、Pages base path、fragment、対象ファイルの契約を検証します。Book QAではJekyll build後の6ページartifactと同じ7リンクも再検証します。

## ローカルビルド/プレビュー（Podman）

ローカルに Ruby/Bundler がない場合は、Podman を利用できます。

```bash
npm run build:podman
npm run dev:podman
```

## ライセンス

- `LICENSE.md` / `LICENSE-SCOPE.md` を参照してください。

## シリーズ情報

- シリーズ: [ITエンジニア知識体系](https://itdojp.github.io/it-engineer-knowledge-architecture/)
- 出版ガイド: [公開中の出版ガイド](https://itdojp.github.io/it-engineer-knowledge-architecture/docs/publishing/)
