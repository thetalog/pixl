package com.nativebridge.pixl

import org.kurento.client.KurentoClient

class RtpClient {

    private val kurentoClient: KurentoClient =
        KurentoClient.create("ws://192.168.1.2:8888/kurento")

}
