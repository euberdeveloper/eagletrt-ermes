#!/bin/bash

# get machine argument
if [ -z "$1" ]; then
    machine="telemetria"
else
    machine=$1
fi

# urls
api_url="https://eagletrt-telemetria-ip.herokuapp.com/api"
get_hostname="$api_url/machines/$machine/hostname"
get_port="$api_url/machines/$machine/port"

# fetch data
hostname="$(curl -s $get_hostname)"
user="ubuntu"
port="$(curl -s $get_port)"

# execute ssh
ssh $user@$hostname -p $port
