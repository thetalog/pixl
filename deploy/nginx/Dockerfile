FROM nginx:1.27-alpine

RUN apk add --no-cache gettext curl \
  && rm -f /etc/nginx/conf.d/default.conf

COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1/ || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
