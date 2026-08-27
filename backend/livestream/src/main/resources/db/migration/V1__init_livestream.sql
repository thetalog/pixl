CREATE TABLE livestream (
    id                  UUID PRIMARY KEY,
    pixl_stream_id      VARCHAR(64) NOT NULL UNIQUE,
    host_user_id        VARCHAR(64) NOT NULL,
    host_username       VARCHAR(128) NOT NULL,
    host_display_name   VARCHAR(256),
    host_avatar_url     TEXT,
    title               VARCHAR(200) NOT NULL,
    status              VARCHAR(32) NOT NULL,
    visibility          VARCHAR(32) NOT NULL DEFAULT 'PUBLIC',
    recording_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
    janus_room_id       BIGINT,
    publisher_feed_id   BIGINT,
    like_count          BIGINT NOT NULL DEFAULT 0,
    reaction_count      BIGINT NOT NULL DEFAULT 0,
    peak_viewer_count   INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL,
    started_at          TIMESTAMPTZ,
    ended_at            TIMESTAMPTZ,
    failure_reason      TEXT
);

CREATE INDEX idx_livestream_status ON livestream (status);
CREATE INDEX idx_livestream_host ON livestream (host_user_id);

CREATE TABLE livestream_moderator (
    id              UUID PRIMARY KEY,
    stream_id       UUID NOT NULL REFERENCES livestream (id) ON DELETE CASCADE,
    user_id         VARCHAR(64) NOT NULL,
    granted_by      VARCHAR(64) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL,
    UNIQUE (stream_id, user_id)
);

CREATE TABLE livestream_event (
    id              UUID PRIMARY KEY,
    stream_id       UUID NOT NULL REFERENCES livestream (id) ON DELETE CASCADE,
    event_type      VARCHAR(64) NOT NULL,
    actor_user_id   VARCHAR(64),
    payload         TEXT,
    created_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_livestream_event_stream ON livestream_event (stream_id, created_at);

CREATE TABLE livestream_chat_message (
    id              UUID PRIMARY KEY,
    stream_id       UUID NOT NULL REFERENCES livestream (id) ON DELETE CASCADE,
    user_id         VARCHAR(64) NOT NULL,
    username        VARCHAR(128) NOT NULL,
    avatar_url      TEXT,
    body            VARCHAR(500) NOT NULL,
    deleted         BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by      VARCHAR(64),
    created_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_chat_stream_created ON livestream_chat_message (stream_id, created_at);

CREATE TABLE livestream_recording (
    id              UUID PRIMARY KEY,
    stream_id       UUID NOT NULL REFERENCES livestream (id) ON DELETE CASCADE,
    storage_backend VARCHAR(32) NOT NULL,
    object_key      TEXT NOT NULL,
    content_type    VARCHAR(128),
    size_bytes      BIGINT,
    status          VARCHAR(32) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL,
    completed_at    TIMESTAMPTZ
);
