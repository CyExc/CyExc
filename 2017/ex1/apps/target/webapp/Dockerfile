FROM tomcat:7
MAINTAINER Naoko Sato

RUN set -ex; \
	if ! grep -q stretch /etc/apt/sources.list; then \
# only add stretch if we're not already building from within stretch
		{ \
			echo 'deb http://deb.debian.org/debian stretch main'; \
			echo 'deb http://security.debian.org stretch/updates main'; \
			echo 'deb http://deb.debian.org/debian stretch-updates main'; \
		} > /etc/apt/sources.list.d/stretch.list; \
	fi

# install nodejs and npm for reverse shell script in nodejs
RUN apt-get update && apt-get install -y wget nodejs npm
RUN npm install argv body-parser errorhandler express request

RUN wget http://central.maven.org/maven2/org/apache/struts/struts2-showcase/2.3.12/struts2-showcase-2.3.12.war
RUN set -ex \
  && ls -l \
  && ls -l /usr/local/tomcat/webapps \
  && cp ./struts2-showcase-2.3.12.war /usr/local/tomcat/webapps \
	&& chmod a+x /usr/local/tomcat/bin/*.sh

EXPOSE 8080
CMD ["catalina.sh", "run"]
