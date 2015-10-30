#!/bin/bash
case "$1" in
"client_console")
  xrdb lib/urxvt-config
  urxvt256c -geometry 84x48 -e bash -c 'echo -ne "\033]0;client_console\007"; node client_console.js'
  ;;
"client_vnc")
  vncviewer -Shared -geometry=640x480 localhost:0
  ;;
"twitch_master")
  node twitch_master.js
  ;;
"qemu")
  node qemu.js
  ;;
*)
  echo "No such command"
  exit 1
  ;;
esac
