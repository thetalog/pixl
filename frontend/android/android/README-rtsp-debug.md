RTSP native debug notes
========================

This short document records the recommended steps to build and run the native RTSP test binary (`rtsp_main`) and how to collect symbolized crash output.

1) Build debug native artifacts (arm64-v8a)

```bash
cd android/app
rm -rf build-android-debug && mkdir build-android-debug && cd build-android-debug
export ANDROID_NDK_HOME=$(ls -d ~/Android/Sdk/ndk/* | sort -V | tail -n1)
cmake -G "Unix Makefiles" \
  -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK_HOME/build/cmake/android.toolchain.cmake \
  -DANDROID_ABI=arm64-v8a \
  -DANDROID_PLATFORM=android-24 \
  -DCMAKE_BUILD_TYPE=Debug \
  -DBUILD_RTSP_MAIN=ON ..
make -j$(nproc)
```

This produces `rtsp_main` and `librtsp_serve.so` in the build directory.

2) Push and run on the device (manual test)

```bash
adb push rtsp_main /data/local/tmp/
adb push librtsp_serve.so /data/local/tmp/
adb shell chmod 755 /data/local/tmp/rtsp_main /data/local/tmp/librtsp_serve.so
adb shell sh -c 'LD_LIBRARY_PATH=/data/local/tmp /data/local/tmp/rtsp_main'
```

If it crashes, check `/data/tombstones` for the newest tombstone file.

3) Symbolize a tombstone with `ndk-stack`

On the host, run:

```bash
export ANDROID_NDK_HOME=$(ls -d ~/Android/Sdk/ndk/* | sort -V | tail -n1)
# Path to the app build symbols (the build dir created above)
ndk-stack -sym /home/anya/Documents/personal_projects/pixl/frontend/pixl_clean/android/app/build-android-debug -dump /path/to/pulled/tombstone
```

4) Alternative: run under gdbserver

If you prefer interactive debugging, install `gdbserver` on the device and run the binary under it, then forward the port and attach from the host. This requires matching gdb for the NDK toolchain; see NDK docs for `ndk-gdb` or `gdbserver` usage.

Notes
- The project already sets `BUILD_RTSP_MAIN` OFF by default in `CMakeLists.txt` so the test binary is not packaged into the APK.
- The app `build.gradle.kts` ABI filters are already set to `arm64-v8a` to match the prebuilt native dependencies.

If you want, I can commit these debug notes into the repo as I've done, or open a small patch that updates the `CMakeLists.txt` comments instead.
