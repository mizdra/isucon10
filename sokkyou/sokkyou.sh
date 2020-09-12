#!/bin/bash
set -eux

# デフォルトでは isucon-server1 にデプロイ、REMOTE_LIST環境変数が指定されていれば、そのホストにデプロイする
# ex: isucon-server2 にデプロイする場合
#  REMOTE_LIST="isucon-server2" ./sokkyou/deploy_mysql.sh
# ex: isucon-server1 及び isucon-server2 にデプロイする場合
#  REMOTE_LIST="isucon-server1 isucon-server2" ./sokkyou/deploy_mysql.sh
BACKEND=${REMOTE_LIST:-"isucon-server1"}
MYSQL=${REMOTE_LIST:-"isucon-server1"}
NGINX=${REMOTE_LIST:-"isucon-server1"}

# /etc/sudoersに追加する
# Defaults!/usr/bin/rsync    !requiretty
function RSYNC() {
  rsync --rsync-path='sudo rsync' -avz --exclude-from=.gitignore --exclude='.git' -e 'ssh' "$1" "$REMOTE:$2"
}

# function RSYNC_GIT() {
#     rsync -avz -e ssh --rsync-path='sudo rsync' --exclude=.git --exclude=`git -C $1 ls-files --exclude-standard -oi --directory` "$1" "$REMOTE:$2"
# }

# function BACKUP() {
#     rsync -avz -e ssh --rsync-path='sudo rsync' --exclude='.*' "$REMOTE:$1" "$2"
# }