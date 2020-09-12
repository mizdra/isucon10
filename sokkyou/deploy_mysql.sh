#!/bin/bash
source ./sokkyou/sokkyou.sh

for REMOTE in ${MYSQL[@]}; do
  RSYNC conf/mysql/my.cnf /etc/mysql/my.cnf
  ssh $REMOTE "sudo systemctl restart mysql"
done
