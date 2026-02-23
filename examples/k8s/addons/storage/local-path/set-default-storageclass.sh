#!/usr/bin/env bash
set -euo pipefail

# local-path を default StorageClass にする例です（任意）。

kubectl patch storageclass local-path \
  -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'

