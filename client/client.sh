#!/bin/sh
# Dependencies: curl jq awk ip

query_url="http://127.0.0.1:4040/api/tunnels"
response="$(curl -s $query_url)"

ngrok_url="$(echo $response | jq -r '.tunnels[0].public_url')"
local_ip="$(ip route get 1 | awk '{print $(NF-2); exit}')"
public_ip="$(curl -s https://ipinfo.io/ip)"
user="$(id -un)"

curl -X POST -sH "Content-Type: application/json" -d "{ \"ngrokUrl\":\"$ngrok_url\", \"localIp\":\"$local_ip\", \"publicIp\":\"$public_ip\", \"user\":\"$user\" }" http://eagletrt-telemetria-ip.herokuapp.com/api/machines/telemetria