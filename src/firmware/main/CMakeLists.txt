idf_component_register(
  SRCS
    "app_main.cpp"
    "tof_sensors.cpp"
    "motors.cpp"
    "ina219.cpp"
  INCLUDE_DIRS "."
  REQUIRES "ESP32_VL53L0X" driver
)
