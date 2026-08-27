package com.pixl.livestream;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.pixl.livestream.config.LivestreamProperties;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(LivestreamProperties.class)
public class LivestreamApplication {

    public static void main(String[] args) {
        SpringApplication.run(LivestreamApplication.class, args);
    }
}
