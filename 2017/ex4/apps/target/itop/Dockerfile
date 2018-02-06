FROM tutum/lamp:latest
MAINTAINER Naoko Sato

# Install additional packages
RUN apt-get update && \
  apt-get -y install \
            php5-mcrypt \
            php5-gd \
            php5-ldap \
            php5-cli \
            php-soap \
            php5-json \
            php5-imap \
            graphviz \
            wget \
            unzip \
            ngrep \
            nodejs \
            npm
RUN php5enmod mcrypt ldap gd imap

#RUN chmod 755 /*.sh

# Get iTop 2.2.0
RUN mkdir -p /tmp/itop
RUN wget --no-check-certificate -O /tmp/itop/itop.zip https://sourceforge.net/projects/itop/files/itop/2.2.0/iTop-2.2.0-2459.zip/download?use_mirror=cfhcable
RUN unzip /tmp/itop/itop.zip -d /tmp/itop/

# Configure /app folder with iTop
RUN rm -fr /app
RUN mkdir -p /app && cp -r /tmp/itop/web/* /app && rm -rf /tmp/itop

RUN chown -R www-data:www-data /app

#Enviornment variables to configure php
ENV PHP_UPLOAD_MAX_FILESIZE 8M
ENV PHP_POST_MAX_SIZE 10M

EXPOSE 80 3306
CMD ["/run.sh"]
