#!/bin/bash
set -eux

source ./sokkyou/sokkyou.sh

DATE=$(date '+%Y%m%d_%H%M%S')

for REMOTE in ${NGINX[@]}; do
  ssh "isucon@$REMOTE" "if [ -f /var/log/nginx/access.log ]; then sudo mv /var/log/nginx/access.log /var/log/nginx/access.log.$DATE; fi"
done

ssh "isucon@$MYSQL" "if [ -f /var/log/mysql/mysql-slow.log ]; then sudo mv /var/log/mysql/mysql-slow.log /var/log/mysql/mysql-slow.log.$DATE; fi"

./sokkyou/deploy_nginx.sh
./sokkyou/deploy_mysql.sh
