#!/bin/bash
cd ~/qemu/x86_64-softmmu
./qemu-system-x86_64 -cdrom ~/archlinux-2015.10.01-dual-patched.iso -vnc :0 -monitor stdio -m 1G -smp 2 -drive file=~/Arch.img,index=0,media=disk,format=raw
