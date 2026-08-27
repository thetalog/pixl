package com.pixl.livestream.recording;

import java.util.UUID;

public interface ObjectStorage {

    String keyFor(UUID streamId);

    String backend();
}
