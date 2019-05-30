FROM alpine AS certificate-gen
RUN apk add openssl
WORKDIR /certs
COPY openssl.conf .
RUN mkdir out
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 -config openssl.conf -keyout out/server.key -out out/server.crt

FROM traefik
COPY --from=certificate-gen /certs/out /etc/ssl/certs/
COPY traefik.toml /etc/traefik/traefik.toml
