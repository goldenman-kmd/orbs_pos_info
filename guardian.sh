#!/bin/bash
filename='guardianlist.txt'

echo "START : guardian.sh"
echo "read from $filename"

n=1
echo "[" > guardians.json

while read line; do
# reading each line
echo "[$n] : $line"

if [ $n -gt 1 ] 
then
echo "," >> guardians.json
fi

echo \{\"address\":\"$line\",\"balance\":$(curl -s "https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0xff56cc6b1e6ded347aa0b7676c85ab0b3d08b0fa&address=$line&tag=latest"),\"reward\":$(curl -s https://orbs-voting-proxy-server.herokuapp.com/api/rewards/$line)\} >> guardians.json
n=$((n+1))
done < $filename
echo "]" >> guardians.json


echo "DONE : guardian.sh"
