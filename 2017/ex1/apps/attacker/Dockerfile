FROM debian:stretch-slim
MAINTAINER Naoko Sato

ENV DEBIAN_FRONTEND noninteractive

RUN set -ex; \
	if ! grep -q stretch /etc/apt/sources.list; then \
# only add stretch if we're not already building from within stretch
		{ \
			echo 'deb http://deb.debian.org/debian stretch main'; \
			echo 'deb http://security.debian.org stretch/updates main'; \
			echo 'deb http://deb.debian.org/debian stretch-updates main'; \
		} > /etc/apt/sources.list.d/stretch.list; \
	fi

## Install dependencies
RUN apt-get update && apt-get install -y curl sudo gnupg2 \
    && curl -sL https://deb.nodesource.com/setup_9.x | sudo bash -
RUN apt-get update \
    && apt-get install -y nodejs npm wget \
    && npm -g install n \
    && npm update npm -g \
    && n stable

## cleanup
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN useradd cyexc
RUN mkdir -p /home/cyexc/ex1
COPY ./CVE-2017-5638.js /home/cyexc/ex1
COPY ./reverseShellClient.js /home/cyexc/ex1
COPY ./package.json /home/cyexc/ex1
COPY ./index.ejs /home/cyexc/ex1
COPY ./index.html /home/cyexc/ex1
RUN chown cyexc:cyexc -R /home/cyexc/ex1
RUN chmod 700 /home/cyexc/ex1/CVE-2017-5638.js

WORKDIR /home/cyexc/ex1/
RUN npm install
USER cyexc
EXPOSE 8081
CMD ["npm", "start"]
