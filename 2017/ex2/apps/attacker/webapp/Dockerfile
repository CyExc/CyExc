FROM node:latest
MAINTAINER Naoko Sato

RUN useradd cyexc && mkdir -p /home/cyexc/ex2A
COPY ./aserver.js /home/cyexc/ex2A
COPY ./bind_shell.py /home/cyexc/ex2A
COPY ./package.json /home/cyexc/ex2A
RUN chown cyexc:cyexc -R /home/cyexc/ex2A \
    && chmod 700 /home/cyexc/ex2A/aserver.js

WORKDIR /home/cyexc/ex2A/
RUN npm install
USER cyexc
EXPOSE 8081
CMD ["npm", "start"]
