#!/bin/bash
source ./sokkyou/sokkyou.sh

for REMOTE in ${BACKEND[@]}; do
  echo "deploy ($REMOTE $USER)"

  rsync -avz --exclude-from=.gitignore --exclude='.git' -e 'ssh' . isucon@$REMOTE:/home/isucon/isuumo/webapp/

  ssh isucon@$REMOTE 'export PATH=/home/isucon/local/node/bin:$PATH && cd /home/isucon/isuumo/webapp/nodejs && /home/isucon/local/node/bin/npm install && sudo systemctl restart isuumo.nodejs.service && sudo sysctl -p'

  echo ":ok_hand:"
done