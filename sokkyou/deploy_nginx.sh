#!/bin/bash
source ./sokkyou/sokkyou.sh

for REMOTE in ${NGINX[@]}; do
  RSYNC conf/nginx/nginx.conf /etc/nginx/nginx.conf
  ssh $REMOTE "sudo systemctl restart nginx"
done
