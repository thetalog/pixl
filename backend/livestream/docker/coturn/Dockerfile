FROM coturn/coturn:4.6
USER root
COPY turnserver.conf /etc/coturn/turnserver.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3478 3478/udp 5349 5349/udp 49160-49200/udp
ENTRYPOINT ["/entrypoint.sh"]
