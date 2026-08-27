package com.pixl.livestream.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.pixl.livestream.common.ApiException;
import com.pixl.livestream.config.LivestreamProperties;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class LiveTokenService {

    private final LivestreamProperties properties;
    private final SecretKey key;

    public LiveTokenService(LivestreamProperties properties) {
        this.properties = properties;
        byte[] bytes = properties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            bytes = java.util.Arrays.copyOf(bytes, 32);
        }
        this.key = Keys.hmacShaKeyFor(bytes);
    }

    public String issue(LivePrincipal principal, Instant expiresAt) {
        List<String> perms = principal.permissions().stream().map(Enum::name).toList();
        return Jwts.builder()
                .issuer(properties.getJwt().getIssuer())
                .audience().add(properties.getJwt().getAudience()).and()
                .subject(principal.userId())
                .claim("email", principal.email())
                .claim("userName", principal.userName())
                .claim("name", principal.displayName())
                .claim("profilePic", principal.avatarUrl())
                .claim("streamId", principal.streamId())
                .claim("pixlStreamId", principal.pixlStreamId())
                .claim("role", principal.role().name())
                .claim("permissions", perms)
                .id(UUID.randomUUID().toString())
                .expiration(Date.from(expiresAt))
                .issuedAt(new Date())
                .signWith(key)
                .compact();
    }

    public LivePrincipal parse(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(properties.getJwt().getIssuer())
                    .requireAudience(properties.getJwt().getAudience())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            LiveRole role = LiveRole.valueOf(String.valueOf(claims.get("role")));
            List<LivePermission> permissions = new ArrayList<>();
            Object rawPerms = claims.get("permissions");
            if (rawPerms instanceof Collection<?> collection) {
                for (Object item : collection) {
                    permissions.add(LivePermission.valueOf(String.valueOf(item)));
                }
            }
            return new LivePrincipal(
                    claims.getSubject(),
                    str(claims.get("email")),
                    str(claims.get("userName")),
                    str(claims.get("name")),
                    str(claims.get("profilePic")),
                    str(claims.get("streamId")),
                    str(claims.get("pixlStreamId")),
                    role,
                    List.copyOf(permissions)
            );
        } catch (Exception ex) {
            throw ApiException.unauthorized("Invalid livestream token");
        }
    }

    private static String str(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
