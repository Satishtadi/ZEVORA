package com.zevora.settings;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SettingsService {
    private final SystemSettingRepository repository;

    public SettingsService(SystemSettingRepository repository) {
        this.repository = repository;
    }

    public String get(String key, String fallback) {
        return repository.findBySettingKey(key).map(SystemSetting::getSettingValue).orElse(fallback);
    }

    public double getDouble(String key, double fallback) {
        try {
            return Double.parseDouble(get(key, String.valueOf(fallback)));
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    public int getInt(String key, int fallback) {
        return (int) getDouble(key, fallback);
    }

    @Transactional
    public SystemSetting set(String key, String value, String description) {
        SystemSetting setting = repository.findBySettingKey(key)
                .orElseGet(() -> SystemSetting.builder().settingKey(key).build());
        setting.setSettingValue(value);
        if (description != null) setting.setDescription(description);
        return repository.save(setting);
    }

    @Transactional(readOnly = true)
    public List<SystemSetting> all() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Map<String, String> asMap() {
        return repository.findAll().stream()
                .collect(Collectors.toMap(SystemSetting::getSettingKey, SystemSetting::getSettingValue));
    }
}
