package com.zevora.settings;

import com.zevora.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "system_settings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSetting extends BaseEntity {
    @Column(name = "setting_key", nullable = false, unique = true, length = 80)
    private String settingKey;

    @Column(name = "setting_value", nullable = false, length = 500)
    private String settingValue;

    @Column(length = 255)
    private String description;
}
