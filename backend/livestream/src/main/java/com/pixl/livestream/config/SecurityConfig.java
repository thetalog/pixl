package com.pixl.livestream.config;

import java.util.List;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import com.pixl.livestream.security.InternalAuthFilter;
import com.pixl.livestream.security.LiveJwtFilter;

@Configuration
public class SecurityConfig {

    @Bean
    FilterRegistrationBean<InternalAuthFilter> internalAuthFilterRegistration(InternalAuthFilter filter) {
        FilterRegistrationBean<InternalAuthFilter> bean = new FilterRegistrationBean<>(filter);
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE + 20);
        return bean;
    }

    @Bean
    FilterRegistrationBean<LiveJwtFilter> liveJwtFilterRegistration(LiveJwtFilter filter) {
        FilterRegistrationBean<LiveJwtFilter> bean = new FilterRegistrationBean<>(filter);
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE + 21);
        return bean;
    }

    @Bean
    CorsFilter corsFilter(LivestreamProperties properties) {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = properties.getCors().getAllowedOrigins();
        if (origins == null || origins.isEmpty() || origins.contains("*")) {
            config.addAllowedOriginPattern("*");
        } else {
            config.setAllowedOrigins(origins);
            config.setAllowCredentials(true);
        }
        config.addAllowedOriginPattern("http://localhost:*");
        config.addAllowedOriginPattern("https://localhost:*");
        config.addAllowedOriginPattern("http://127.0.0.1:*");
        config.addAllowedOriginPattern("https://127.0.0.1:*");
        config.addAllowedOriginPattern("http://192.168.*.*:*");
        config.addAllowedOriginPattern("https://192.168.*.*:*");
        config.addAllowedOriginPattern("http://10.*.*.*:*");
        config.addAllowedOriginPattern("https://10.*.*.*:*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
