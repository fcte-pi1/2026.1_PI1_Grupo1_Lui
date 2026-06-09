#!/usr/bin/env bash
set -e

# 1. Compile the firmware
idf.py build

# 2. Merge the binaries into a single flash image (QEMU requires a single raw flash layout)
esptool.py --chip esp32 merge_bin \
  -o build/flash_image.bin \
  --flash_mode dio \
  --flash_size 2MB \
  --flash_freq 40m \
  --fill-flash-size 2MB \
  0x1000 build/bootloader/bootloader.bin \
  0x8000 build/partition_table/partition-table.bin \
  0x10000 build/firmware.bin

echo "=================================================="
echo "Starting QEMU emulation for ESP32..."
echo "To exit QEMU, press: Ctrl+A then X"
echo "=================================================="

# 3. Launch QEMU (redirecting serial stdout directly to the terminal)
qemu-system-xtensa -nographic -machine esp32 -drive file=build/flash_image.bin,if=mtd,format=raw
