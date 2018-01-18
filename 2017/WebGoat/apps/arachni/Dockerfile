###
# reference @ http://www.arachni-scanner.com/download/#Linux
###
FROM ruby:2.4.3-slim-jessie
MAINTAINER Naoko Sato

ARG VERSION=1.5.1
ARG WEBUI_VERSION=0.5.12

RUN apt-get update && apt-get -y install wget

RUN mkdir /arachni && \
    wget -qO- https://github.com/Arachni/arachni/releases/download/v${VERSION}/arachni-${VERSION}-${WEBUI_VERSION}-linux-x86_64.tar.gz | tar xvz -C /arachni --strip-components=1
WORKDIR /arachni
EXPOSE 9292
ENTRYPOINT ["bin/arachni_web", "--host", "0.0.0.0"]
