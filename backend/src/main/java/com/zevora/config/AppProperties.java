package com.zevora.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private String jwtSecret;
    private long accessTokenMinutes = 60;
    private long refreshTokenDays = 30;
    private List<String> corsOrigins = new ArrayList<>();
    private boolean devMode = true;
    private boolean seedDemo = true;
    private BigDecimal platformFeePercent = BigDecimal.valueOf(5);
    private String supportEmail = "support@zevora.in";
}
