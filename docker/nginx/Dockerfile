FROM nginx

ARG PROJECT_DOMAIN_CORE
ARG ENV

MAINTAINER Vasilij Dusko <vasilij@prado.lt>

# optional commands to run at shell inside container at build time
# this one adds package repo for nginx from nginx.org and installs it

RUN ln -sf /dev/stdout /var/log/nginx/access.log \
	&& ln -sf /dev/stderr /var/log/nginx/error.log
# forward request and error logs to docker log collector

RUN mkdir -p /etc/nginx/sites-available && \
    mkdir -p /etc/nginx/sites-enabled

ADD core.conf /etc/nginx/sites-available/

RUN sed -i 's#__PROJECT_DOMAIN_CORE__#'"${PROJECT_DOMAIN_CORE}"'#g' /etc/nginx/sites-available/core.conf
RUN sed -i 's#__ENV__#'"${ENV}"'#g' /etc/nginx/sites-available/core.conf

RUN ln -s /etc/nginx/sites-available/core.conf /etc/nginx/sites-enabled/core.conf
COPY certs/core.${ENV}.pub /etc/ssl/certs/core.${ENV}.pub
COPY certs/core.${ENV}.priv /etc/ssl/certs/core.${ENV}.priv

RUN echo "upstream php-upstream { server core:9000; }" > /etc/nginx/conf.d/upstream.conf

CMD ["nginx", "-g", "daemon off;"]
# required: run this command when container is launched
# only one CMD allowed, so if there are multiple, last one wins
