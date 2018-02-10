# CyExcで使用するboxについて
## Motivation
[UbuntuオフィシャルBox](https://app.vagrantup.com/ubuntu/boxes/trusty64)のディスク容量は40GBに設定されている。CyExcで使用するDockerイメージは1つで１GBを必要としないため、リソースのパフォーマンス観点から独自のUbuntu Virtualboxイメージ（10GB程度）を作成して使用するのが好ましい。

## Prerequisite
* [Packer](https://www.packer.io/intro/index.html)
* Vagrant
* Virtualbox

## Installation
1. packer build ubuntu14.04.json
2. vagrant box add --name my-cyexc ubuntu-14-04-x64-cyexc.box

## References
* [packer-templates](https://github.com/shiguredo/packer-templates)
