idf_component_register(
    SRCS "main.cpp" "encoder_motor.cpp"
    INCLUDE_DIRS "."
    REQUIRES esp_driver_gpio esp_driver_ledc esp_driver_pcnt
)
