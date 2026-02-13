# Install script for directory: /home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp

# Set the install prefix
if(NOT DEFINED CMAKE_INSTALL_PREFIX)
  set(CMAKE_INSTALL_PREFIX "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/build-android-arm64/install")
endif()
string(REGEX REPLACE "/$" "" CMAKE_INSTALL_PREFIX "${CMAKE_INSTALL_PREFIX}")

# Set the install configuration name.
if(NOT DEFINED CMAKE_INSTALL_CONFIG_NAME)
  if(BUILD_TYPE)
    string(REGEX REPLACE "^[^A-Za-z0-9_]+" ""
           CMAKE_INSTALL_CONFIG_NAME "${BUILD_TYPE}")
  else()
    set(CMAKE_INSTALL_CONFIG_NAME "Release")
  endif()
  message(STATUS "Install configuration: \"${CMAKE_INSTALL_CONFIG_NAME}\"")
endif()

# Set the component getting installed.
if(NOT CMAKE_INSTALL_COMPONENT)
  if(COMPONENT)
    message(STATUS "Install component: \"${COMPONENT}\"")
    set(CMAKE_INSTALL_COMPONENT "${COMPONENT}")
  else()
    set(CMAKE_INSTALL_COMPONENT)
  endif()
endif()

# Install shared libraries without execute permission?
if(NOT DEFINED CMAKE_INSTALL_SO_NO_EXE)
  set(CMAKE_INSTALL_SO_NO_EXE "1")
endif()

# Is this installation the result of a crosscompile?
if(NOT DEFINED CMAKE_CROSSCOMPILING)
  set(CMAKE_CROSSCOMPILING "TRUE")
endif()

# Set default install directory permissions.
if(NOT DEFINED CMAKE_OBJDUMP)
  set(CMAKE_OBJDUMP "/home/deep/Android/Sdk/ndk/27.0.12077973/toolchains/llvm/prebuilt/linux-x86_64/bin/llvm-objdump")
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "Unspecified" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib/pkgconfig" TYPE FILE FILES "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/build-android-arm64/uvgrtp.pc")
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "uvgrtp_Runtime" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib" TYPE STATIC_LIBRARY FILES "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/build-android-arm64/libuvgrtp.a")
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "uvgrtp_Develop" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/include/uvgrtp" TYPE FILE FILES
    "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/include/uvgrtp/clock.hh"
    "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/include/uvgrtp/context.hh"
    "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/include/uvgrtp/frame.hh"
    "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/include/uvgrtp/lib.hh"
    "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/include/uvgrtp/media_stream.hh"
    "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/include/uvgrtp/rtcp.hh"
    "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/include/uvgrtp/session.hh"
    "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/include/uvgrtp/util.hh"
    "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/include/uvgrtp/version.hh"
    "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/include/uvgrtp/wrapper_c.hh"
    )
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "Unspecified" OR NOT CMAKE_INSTALL_COMPONENT)
  if(EXISTS "$ENV{DESTDIR}${CMAKE_INSTALL_PREFIX}/lib/cmake/uvgrtp/uvgrtpTargets.cmake")
    file(DIFFERENT _cmake_export_file_changed FILES
         "$ENV{DESTDIR}${CMAKE_INSTALL_PREFIX}/lib/cmake/uvgrtp/uvgrtpTargets.cmake"
         "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/build-android-arm64/CMakeFiles/Export/ec286d104ed254c2943602fc42ca539f/uvgrtpTargets.cmake")
    if(_cmake_export_file_changed)
      file(GLOB _cmake_old_config_files "$ENV{DESTDIR}${CMAKE_INSTALL_PREFIX}/lib/cmake/uvgrtp/uvgrtpTargets-*.cmake")
      if(_cmake_old_config_files)
        string(REPLACE ";" ", " _cmake_old_config_files_text "${_cmake_old_config_files}")
        message(STATUS "Old export file \"$ENV{DESTDIR}${CMAKE_INSTALL_PREFIX}/lib/cmake/uvgrtp/uvgrtpTargets.cmake\" will be replaced.  Removing files [${_cmake_old_config_files_text}].")
        unset(_cmake_old_config_files_text)
        file(REMOVE ${_cmake_old_config_files})
      endif()
      unset(_cmake_old_config_files)
    endif()
    unset(_cmake_export_file_changed)
  endif()
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib/cmake/uvgrtp" TYPE FILE FILES "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/build-android-arm64/CMakeFiles/Export/ec286d104ed254c2943602fc42ca539f/uvgrtpTargets.cmake")
  if(CMAKE_INSTALL_CONFIG_NAME MATCHES "^([Rr][Ee][Ll][Ee][Aa][Ss][Ee])$")
    file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib/cmake/uvgrtp" TYPE FILE FILES "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/build-android-arm64/CMakeFiles/Export/ec286d104ed254c2943602fc42ca539f/uvgrtpTargets-release.cmake")
  endif()
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "uvgRTPMain" OR NOT CMAKE_INSTALL_COMPONENT)
  file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/lib/cmake/uvgrtp" TYPE FILE FILES
    "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/cmake/uvgrtpConfig.cmake"
    "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/cmake/uvgrtpMacros.cmake"
    "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/build-android-arm64/uvgrtp/uvgrtpConfigVersion.cmake"
    )
endif()

if(NOT CMAKE_INSTALL_LOCAL_ONLY)
  # Include the install script for the subdirectory.
  include("/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/build-android-arm64/packaging/cmake_install.cmake")
endif()

if(CMAKE_INSTALL_COMPONENT)
  set(CMAKE_INSTALL_MANIFEST "install_manifest_${CMAKE_INSTALL_COMPONENT}.txt")
else()
  set(CMAKE_INSTALL_MANIFEST "install_manifest.txt")
endif()

string(REPLACE ";" "\n" CMAKE_INSTALL_MANIFEST_CONTENT
       "${CMAKE_INSTALL_MANIFEST_FILES}")
file(WRITE "/home/deep/Documents/code/Personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/build-android-arm64/${CMAKE_INSTALL_MANIFEST}"
     "${CMAKE_INSTALL_MANIFEST_CONTENT}")
