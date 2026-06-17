idf_component_register(SRCS "main.cpp"
                            "telemetry.cpp"
                            "movement.cpp"
                            "wifi_manager.cpp"
                            "tof_sensor.cpp"
                            "ina219.cpp"
                    INCLUDE_DIRS "."
                    REQUIRES ESP32_VL53L0X
                             bblanchon__arduinojson
                             driver
                             esp_event
                             esp_netif
                             esp_wifi
                             lwip
                             nvs_flash
                             esp_timer)
