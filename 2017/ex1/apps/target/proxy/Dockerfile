FROM nginx
MAINTAINER Naoko Sato

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx

RUN apt-get update && apt-get install -y ngrep
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
