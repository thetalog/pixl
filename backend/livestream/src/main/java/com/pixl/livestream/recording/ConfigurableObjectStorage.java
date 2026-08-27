package com.pixl.livestream.recording;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.pixl.livestream.config.LivestreamProperties;

@Component
public class ConfigurableObjectStorage implements ObjectStorage {

    private final LivestreamProperties properties;

    public ConfigurableObjectStorage(LivestreamProperties properties) {
        this.properties = properties;
    }

    @Override
    public String keyFor(UUID streamId) {
        String backend = backend();
        if ("s3".equals(backend) || "minio".equals(backend)) {
            return "recordings/" + streamId + ".webm";
        }
        String path = properties.getRecording().getLocalPath();
        return path + "/" + streamId + ".webm";
    }

    @Override
    public String backend() {
        return properties.getRecording().getStorage() == null ? "local" : properties.getRecording().getStorage();
    }
}
