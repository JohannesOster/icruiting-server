#!/usr/bin/env bash
sudo openssl req -nodes -new -x509 -subj "/C=US" -keyout /etc/nginx/dummy.key -out /etc/nginx/dummy.crt