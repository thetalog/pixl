FROM canyan/janus-gateway:latest
COPY janus.jcfg /usr/local/etc/janus/janus.jcfg.template
COPY janus.transport.http.jcfg /usr/local/etc/janus/janus.transport.http.jcfg
COPY janus.plugin.videoroom.jcfg /usr/local/etc/janus/janus.plugin.videoroom.jcfg
COPY entrypoint.sh /entrypoint.sh
USER root
RUN chmod +x /entrypoint.sh
EXPOSE 8088 7088 10000-10200/udp
ENTRYPOINT ["/entrypoint.sh"]
