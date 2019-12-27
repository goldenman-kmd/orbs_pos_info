#!/bin/bash

filename='addresses.txt'
resultfile='reward.json'

#if [ $1 = 'guardian' ] 
#then
#filename='guardianlist.txt'
#resultfile='reward_guardian.json'
#fi

echo "START : reward.sh"

echo "read from $filename"
echo "output to $resultfile"

n=1
echo "[" > $resultfile
while read line; do
# reading each line
echo "[$n] : $line"

if [ $n -gt 1 ] 
then
echo "," >> $resultfile
fi

echo \{\"address\":\"$line\",\"reward\":$(curl -s https://orbs-voting-proxy-server.herokuapp.com/api/rewards/$line)\} >> $resultfile
n=$((n+1))
done < $filename
echo "]" >> $resultfile


echo "DONE : reward.sh"
