cmake_minimum_required(VERSION 3.10.2)
project("pixl")

# ============================================
# C++ Settings
# ============================================
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Use hidden visibility for smaller binaries and fewer symbol conflicts
set(CMAKE_CXX_VISIBILITY_PRESET hidden)
set(CMAKE_VISIBILITY_INLINES_HIDDEN ON)

enable_language(ASM)
message(STATUS "Building for ABI: ${ANDROID_ABI}")

# ============================================
# Directories
# ============================================
set(SRC_DIR ${CMAKE_CURRENT_SOURCE_DIR}/src/main/cpp)
set(LIBYUV_DIR ${SRC_DIR}/lib/libyuv)
set(X265_DIR ${SRC_DIR}/lib/x265_git)
set(OPENSSL_ROOT ${SRC_DIR}/lib/openssl)
set(UVGRTP_ROOT ${CMAKE_SOURCE_DIR}/src/main/cpp/lib/uvgrtp)

# ============================================
# Platform Detection
# ============================================
set(IS_ANDROID OFF)
if(CMAKE_SYSTEM_NAME STREQUAL "Android")
    set(IS_ANDROID ON)
endif()

# ============================================
# uvgRTP Configuration (Android only)
# ============================================
set(HAVE_UVGRTP OFF)

if(IS_ANDROID)
    if(NOT DEFINED ANDROID_ABI OR ANDROID_ABI STREQUAL "")
        message(FATAL_ERROR "❌ No ABI specified. Set ANDROID_ABI (e.g., arm64-v8a, x86_64)")
    endif()

    # Check for supported ABIs
    if(ANDROID_ABI STREQUAL "arm64-v8a" OR ANDROID_ABI STREQUAL "x86_64")
        set(UVGRTP_LIB ${UVGRTP_ROOT}/build-android/arm64/libuvgrtp.a)
        
        if(EXISTS ${UVGRTP_LIB})
            set(HAVE_UVGRTP ON)
            message(STATUS "✓ uvgRTP library found: ${UVGRTP_LIB}")
        else()
            message(FATAL_ERROR "❌ Missing uvgRTP library: ${UVGRTP_LIB}")
        endif()
    else()
        message(FATAL_ERROR "❌ Unsupported ABI: ${ANDROID_ABI}. Supported: arm64-v8a, x86_64")
    endif()
else()
    message(STATUS "Configuring for host (non-Android). Skipping Android-specific libraries.")
endif()

# ============================================
# Crypto++ Static Library
# ============================================
file(GLOB CRYPTOPP_SOURCES
    ${CMAKE_CURRENT_SOURCE_DIR}/src/main/cpp/lib/cryptopp/*.cpp
)

# Architecture-specific SIMD exclusions
if(ANDROID_ABI MATCHES "^arm")
    # Exclude ARM-specific SIMD files for NDK 26/27 compatibility
    list(FILTER CRYPTOPP_SOURCES EXCLUDE REGEX ".*arm_simd.cpp$")
    list(FILTER CRYPTOPP_SOURCES EXCLUDE REGEX ".*crc_simd.cpp$")
    list(FILTER CRYPTOPP_SOURCES EXCLUDE REGEX ".*neon_simd.cpp$")
else()
    # For x86_64, exclude x86-specific problematic SIMD files if needed
    # Adjust this based on your actual requirements
    list(FILTER CRYPTOPP_SOURCES EXCLUDE REGEX ".*sse_simd.cpp$")
endif()

add_library(cryptopp STATIC ${CRYPTOPP_SOURCES})

# Crypto++ compile definitions
target_compile_definitions(cryptopp PRIVATE
    CRYPTOPP_DISABLE_ASM
    ANDROID
    NDEBUG
)

# Add ARM-specific disables only for ARM architectures
if(ANDROID_ABI MATCHES "^arm")
    target_compile_definitions(cryptopp PRIVATE
        CRYPTOPP_DISABLE_ARM_CRC32
        CRYPTOPP_DISABLE_ARM_CRYPTO
        CRYPTOPP_DISABLE_ARM_NEON
    )
endif()

target_include_directories(cryptopp PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/src/main/cpp/lib/cryptopp
)

if(IS_ANDROID)
    target_include_directories(cryptopp PUBLIC
        ${ANDROID_NDK}/sources/android/cpufeatures
    )
endif()

# ============================================
# libyuv
# ============================================
set(LIBYUV_INCLUDE_DIR ${LIBYUV_DIR}/include)
if(EXISTS ${LIBYUV_DIR}/CMakeLists.txt)
    add_subdirectory(${LIBYUV_DIR} ${CMAKE_CURRENT_BINARY_DIR}/libyuv)
else()
    message(FATAL_ERROR "❌ libyuv directory not found: ${LIBYUV_DIR}")
endif()

# ============================================
# H265
# ============================================
set(X265_INCLUDE_DIR ${X265_DIR}/source)

# Try multiple possible locations for x265 library
set(HAVE_X265 OFF)
set(X265_TARGET "")

# Check ABI-specific build directory
if(ANDROID_ABI STREQUAL "arm64-v8a")
    set(X265_POSSIBLE_PATHS
        "${X265_DIR}/source/build-android-arm64/libx265.a"
        "${X265_DIR}/source/build/libx265.a"
        "${X265_DIR}/source/lib/libx265.a"
    )
elseif(ANDROID_ABI STREQUAL "x86_64")
    set(X265_POSSIBLE_PATHS
        "${X265_DIR}/source/build-android-x86_64/libx265.a"
        "${X265_DIR}/source/build/libx265.a"
        "${X265_DIR}/source/lib/libx265.a"
    )
else()
    set(X265_POSSIBLE_PATHS "")
endif()

foreach(LIB_PATH ${X265_POSSIBLE_PATHS})
    if(EXISTS ${LIB_PATH})
        set(HAVE_X265 ON)
        set(X265_TARGET ${LIB_PATH})
        message(STATUS "✓ x265 library found at: ${X265_TARGET}")
        break()
    endif()
endforeach()

if(NOT HAVE_X265)
    message(WARNING "⚠ x265 static library not found. Checked paths:")
    foreach(PATH ${X265_POSSIBLE_PATHS})
        message(WARNING "  - ${PATH}")
    endforeach()
    message(WARNING "  encode_raw.cpp will be excluded from build. H265 encoding will be unavailable.")
endif()

# ============================================
# OpenSSL Configuration (ABI-specific)
# ============================================
set(HAVE_OPENSSL OFF)

if(IS_ANDROID)
    if(ANDROID_ABI STREQUAL "arm64-v8a")
        set(OPENSSL_ARM64_DIR ${OPENSSL_ROOT}/build-android-arm64)
        set(OPENSSL_SSL_LIB ${OPENSSL_ARM64_DIR}/lib/libssl.a)
        set(OPENSSL_CRYPTO_LIB ${OPENSSL_ARM64_DIR}/lib/libcrypto.a)
        set(OPENSSL_INCLUDE_DIR ${OPENSSL_ARM64_DIR}/include/openssl)
        
        if(EXISTS ${OPENSSL_SSL_LIB} AND EXISTS ${OPENSSL_CRYPTO_LIB})
            set(HAVE_OPENSSL ON)
            message(STATUS "✓ OpenSSL found for arm64-v8a")
        else()
            message(WARNING "⚠ OpenSSL libraries not found for arm64-v8a, building without SSL")
        endif()
    elseif(ANDROID_ABI STREQUAL "x86_64")
        message(STATUS "OpenSSL not available for x86_64, building without SSL")
    endif()
endif()

# ============================================
# Android System Libraries
# ============================================
if(IS_ANDROID)
    find_library(LOG_LIB log)
    if(NOT LOG_LIB)
        message(FATAL_ERROR "❌ Android log library not found")
    endif()
    
    find_library(ANDROID_LIB android)
    if(NOT ANDROID_LIB)
        message(FATAL_ERROR "❌ Android library not found")
    endif()
    
    find_library(CPP_SHARED c++_shared)
    # cpp_shared is optional
    
    message(STATUS "✓ Android system libraries found")
endif()

# ============================================
# Threading Support (Android-safe)
# ============================================
if(IS_ANDROID)
    set(THREADS_PREFER_PTHREAD_FLAG OFF)
    set(CMAKE_THREAD_LIBS_INIT "")
    set(Threads_FOUND TRUE)
else()
    find_package(Threads REQUIRED)
endif()

# ============================================
# Import uvgRTP Prebuilt Library
# ============================================
if(HAVE_UVGRTP)
    add_library(uvgrtp_prebuilt STATIC IMPORTED)
    set_target_properties(uvgrtp_prebuilt PROPERTIES
        IMPORTED_LOCATION ${UVGRTP_LIB}
        INTERFACE_INCLUDE_DIRECTORIES ${UVGRTP_ROOT}/include
    )
endif()

# ============================================
# Shared Library: librtsp_serve.so
# ============================================
# Build source list conditionally (exclude encode_raw.cpp if x265 unavailable)
set(RTSP_SRCS
    ${SRC_DIR}/convertToARGB.cpp
    ${SRC_DIR}/rtsp_serve.cpp
    ${SRC_DIR}/init_encoders.cpp
    ${SRC_DIR}/release_encoders.cpp
)

if(HAVE_X265)
    list(APPEND RTSP_SRCS ${SRC_DIR}/encode_raw.cpp)
    message(STATUS "✓ Including encode_raw.cpp (x265 available)")
else()
    message(WARNING "⚠ Skipping encode_raw.cpp (x265 not available)")
    # IMPORTANT: Add a stub or handle the missing JNI function in Java
endif()

add_library(rtsp_serve SHARED ${RTSP_SRCS})

# Include directories
target_include_directories(rtsp_serve PRIVATE
    ${LIBYUV_INCLUDE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/src/main/cpp
    ${UVGRTP_ROOT}/include
    ${UVGRTP_ROOT}/include/uvgrtp # <-- uvgRTP headers
)

# Add x265 include dirs only when x265 is available
if(HAVE_X265)
    target_include_directories(rtsp_serve PRIVATE
        ${X265_INCLUDE_DIR}
        ${X265_INCLUDE_DIR}/common
        ${X265_INCLUDE_DIR}/encoder
        ${CMAKE_CURRENT_SOURCE_DIR}/src/main/cpp
        ${X265_INCLUDE_DIR}/build-android-arm64
    )
    # Define X265_DEPTH for x265 headers
    target_compile_definitions(rtsp_serve PRIVATE X265_DEPTH=8)
endif()

# ============================================
# Link Libraries
# ============================================
find_library(ANDROID_LIB android)
find_library(LOG_LIB log)
find_package(Threads REQUIRED)

# Core libraries (always needed)
target_link_libraries(rtsp_serve PRIVATE
    yuv
    cryptopp
    ${LOG_LIB}
)

if(NOT IS_ANDROID)
    target_link_libraries(rtsp_serve PRIVATE Threads::Threads)
endif()

# Link x265 only if available
if(HAVE_X265)
    target_link_libraries(rtsp_serve PRIVATE ${X265_TARGET})
endif()

if(HAVE_UVGRTP)
    target_link_libraries(rtsp_serve PRIVATE uvgrtp_prebuilt)
endif()

# =============
# Build Summary
# ============================================
message(STATUS "")
message(STATUS "========================================")
message(STATUS "Build Configuration Summary")
message(STATUS "========================================")
message(STATUS "Target Platform: ${CMAKE_SYSTEM_NAME}")
if(IS_ANDROID)
    message(STATUS "Android ABI: ${ANDROID_ABI}")
endif()
message(STATUS "C++ Standard: C++${CMAKE_CXX_STANDARD}")
message(STATUS "Build Type: ${CMAKE_BUILD_TYPE}")
message(STATUS "uvgRTP: ${HAVE_UVGRTP}")
message(STATUS "OpenSSL: ${HAVE_OPENSSL}")
message(STATUS "========================================")
message(STATUS "")

#[[
cd ..
rm -rf build-android && mkdir build-android && cd build-android
export ANDROID_NDK_HOME=$(ls -d ~/Android/Sdk/ndk/* | sort -V | tail -n1)
cmake -G "Unix Makefiles" \
  -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK_HOME/build/cmake/android.toolchain.cmake \
  -DANDROID_ABI=arm64-v8a \
  -DANDROID_PLATFORM=android-24 \
  -DCMAKE_BUILD_TYPE=Release \
  ..
make -j$(nproc)
]]