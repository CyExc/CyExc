FROM node:latest
MAINTAINER Naoko Sato

RUN apt-get update && apt-get install -y python-dev sudo

RUN useradd cyexc \
    && echo "cyexc:cyexc" | chpasswd && adduser cyexc sudo \
    && mkdir -p /home/cyexc/ex2T

COPY ./tserver.js /home/cyexc/ex2T
COPY ./package.json /home/cyexc/ex2T
COPY ./index.ejs /home/cyexc/ex2T
COPY ./index.html /home/cyexc/ex2T
RUN chown cyexc:cyexc -R /home/cyexc/ex2T \
    && chmod 700 /home/cyexc/ex2T/tserver.js

WORKDIR /home/cyexc/ex2T/
RUN npm install
USER cyexc
EXPOSE 8080 443
CMD ["npm", "start"]
