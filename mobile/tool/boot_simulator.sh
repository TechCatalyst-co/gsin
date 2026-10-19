#!/usr/bin/env bash
# Boots an iOS simulator or Android emulator and waits until Flutter can run on it.
#
#   tool/boot_simulator.sh ios [device name]       default: "iPhone 17 Pro"
#   tool/boot_simulator.sh android [avd name]      default: first AVD from `emulator -list-avds`
#
# Safe to run when the device is already up. Used as the preLaunchTask of the
# simulator configurations in .vscode/launch.json.
set -euo pipefail

platform="${1:-}"
name="${2:-}"

case "$platform" in
  ios)
    name="${name:-iPhone 17 Pro}"
    # `bootstatus -b` boots the device if needed and blocks until it is ready.
    xcrun simctl bootstatus "$name" -b >/dev/null
    # Show the device: Device Hub ships inside newer Xcodes, Simulator.app in older ones.
    xcode_apps="$(xcode-select -p)/../Applications"
    open -a "$xcode_apps/DeviceHub.app" 2>/dev/null \
      || open -a Simulator 2>/dev/null \
      || echo "No Device Hub or Simulator app found; $name is running headless."
    echo "iOS simulator ready: $name"
    ;;
  android)
    sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
    adb="$sdk/platform-tools/adb"
    emulator="$sdk/emulator/emulator"
    name="${name:-$("$emulator" -list-avds | head -n 1)}"
    if [ -z "$name" ]; then
      echo "No Android AVD found. Create one in Android Studio's Device Manager." >&2
      exit 1
    fi
    if ! "$adb" devices | grep -q '^emulator-.*device$'; then
      nohup "$emulator" -avd "$name" >/dev/null 2>&1 &
    fi
    "$adb" wait-for-device
    until [ "$("$adb" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
      sleep 2
    done
    echo "Android emulator ready: $name"
    ;;
  *)
    echo "usage: $0 ios|android [device name]" >&2
    exit 2
    ;;
esac
