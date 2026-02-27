# docs/assets/images/

本ディレクトリは、本書で参照する画像（主にスクリーンショット）を配置するための領域です。

## 方針（要点）

- **対象バージョンを明記**: UI/表示項目が変わるため、キャプションに対象バージョン（例: Proxmox VE 8.x / Kubernetes v1.35 など）を併記する。
- **秘匿情報のマスキング**（必須）:
  - IP/ホスト名/ユーザー名/トークン/APIキー/URL（query/ヘッダ含む）/クラウドアカウントID など
- **alt テキスト**: 画面の意味が分かる日本語（検索性/アクセシビリティを優先）。

## 配置

- スクリーンショットは `docs/assets/images/screenshots/` 配下に配置する。
- 形式は PNG を基本とし、必要に応じて WebP を検討する（可読性優先）。

## 命名規則（推奨）

- `chXX-<topic>-NN.png`
  - `XX`: 章番号（2桁）
  - `topic`: 英小文字の kebab-case（例: `pve-vm-list` / `kubectl-get-nodes`）
  - `NN`: 章内の並び順（2桁）
  - 例: `ch03-pve-cluster-01.png`

## 本文からの参照例

Jekyll の `relative_url` を使い、環境差分を吸収する。

```md
![Proxmox の VM 一覧（例: Proxmox VE 8.x）]({{ '/assets/images/screenshots/ch03-pve-vm-list-01.png' | relative_url }})
```

