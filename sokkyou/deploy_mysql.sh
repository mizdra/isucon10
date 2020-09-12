#!/bin/bash
source ./sokkyou/sokkyou.sh

echo "⚡️ Deploy mysql"

for REMOTE in ${MYSQL[@]}; do
  echo "🚀 Deploy mysql ($REMOTE $USER)"
  RSYNC conf/mysql/my.cnf /etc/mysql/my.cnf
  ssh $REMOTE "sudo systemctl restart mysql"
done

echo "👌 success"
