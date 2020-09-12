#!/bin/bash
source ./sokkyou/sokkyou.sh

echo "⚡️ Deploy nginx"

for REMOTE in ${NGINX[@]}; do
  echo "🚀 Deploy nginx ($REMOTE $USER)"
  RSYNC conf/nginx/nginx.conf /etc/nginx/nginx.conf
  RSYNC conf/nginx/sites-available/isuumo.conf /etc/nginx/sites-available/isuumo.conf
  ssh $REMOTE "sudo systemctl restart nginx"
done
