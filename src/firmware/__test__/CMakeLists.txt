cmake_minimum_required(VERSION 3.16)
project(floodfill_test)

# Catch2 via FetchContent
include(FetchContent)
FetchContent_Declare(
  Catch2
  GIT_REPOSITORY https://github.com/catchorg/Catch2.git
  GIT_TAG        v3.7.1
)
FetchContent_MakeAvailable(Catch2)

# Arquivos fonte do floodfill (sem main.cpp do firmware)
set(FLOODFILL_SOURCES
  ${CMAKE_SOURCE_DIR}/../floodfill/flood_fill.cpp
)

# simulador/Main.cpp compilado em modo TESTING (sem a funcao main)
set(SIMULADOR_SOURCES
  ${CMAKE_SOURCE_DIR}/../simulador/Main.cpp
)

add_executable(test_floodfill
  test_flood_fill.cpp
  test_ff_inicializar.cpp
  test_ff_helpers.cpp
  test_salva_json.cpp
  test_main_exploracao.cpp
  ${FLOODFILL_SOURCES}
  ${SIMULADOR_SOURCES}
)

target_include_directories(test_floodfill PRIVATE
  ${CMAKE_SOURCE_DIR}/../floodfill
  ${CMAKE_SOURCE_DIR}/../simulador
)

target_compile_definitions(test_floodfill PRIVATE TESTING)
target_compile_definitions(test_floodfill PRIVATE PROJECT_ROOT_DIR="${CMAKE_CURRENT_SOURCE_DIR}/../..")

target_link_libraries(test_floodfill PRIVATE Catch2::Catch2WithMain)

# Descoberta de testes com CTest
include(CTest)
include(Catch)
catch_discover_tests(test_floodfill)

# Bancada virtual do PID (sem dependencia de FreeRTOS/ESP-IDF)
set(PID_SOURCES
  ${CMAKE_SOURCE_DIR}/../main/pid.cpp
)

add_executable(test_pid
  test_pid_convergencia.cpp
  test_pid_antiwindup.cpp
  ${PID_SOURCES}
)

target_include_directories(test_pid PRIVATE
  ${CMAKE_SOURCE_DIR}/../main
)

target_link_libraries(test_pid PRIVATE Catch2::Catch2WithMain)

catch_discover_tests(test_pid)
