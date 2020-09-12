#!/bin/bash
set -ex

# REMOTE_LIST="isucon-server1 isucon-server2 isucon-server3" ./sokkyou/deploy.sh

echo "⚡️⚡️⚡️ Deploy everything"

./sokkyou/deploy_backend.sh
./sokkyou/deploy_nginx.sh
./sokkyou/deploy_mysql.sh

echo "👌👌👌 success"
