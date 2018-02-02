FROM php:7.0-apache
MAINTAINER Naoko Sato

# install the PHP extensions we need
RUN set -ex; \
	apt-get update; \
    apt-get install -y vim; \
	rm -rf /var/lib/apt/lists/*

COPY src/ /var/www/html/
