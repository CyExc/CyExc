FROM node:latest
MAINTAINER Naoko Sato

RUN useradd cyexc && mkdir -p /home/cyexc/ex1
COPY ./CVE-2017-5638.js /home/cyexc/ex1
COPY ./reverseShellClient.js /home/cyexc/ex1
COPY ./package.json /home/cyexc/ex1
COPY ./index.ejs /home/cyexc/ex1
COPY ./index.html /home/cyexc/ex1
RUN chown cyexc:cyexc -R /home/cyexc/ex1 \
		&& chmod 700 /home/cyexc/ex1/CVE-2017-5638.js

WORKDIR /home/cyexc/ex1/
RUN npm install
USER cyexc
EXPOSE 8081
CMD ["npm", "start"]
