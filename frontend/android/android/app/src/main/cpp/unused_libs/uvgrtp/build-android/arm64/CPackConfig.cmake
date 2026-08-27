# This file will be configured to contain variables for CPack. These variables
# should be set in the CMake list file of the project before CPack module is
# included. The list of available CPACK_xxx variables and their associated
# documentation may be obtained using
#  cpack --help-variable-list
#
# Some variables are common to all generators (e.g. CPACK_PACKAGE_NAME)
# and some are specific to a generator
# (e.g. CPACK_NSIS_EXTRA_INSTALL_COMMANDS). The generator specific variables
# usually begin with CPACK_<GENNAME>_xxxx.


set(CPACK_BINARY_DEB "OFF")
set(CPACK_BINARY_FREEBSD "OFF")
set(CPACK_BINARY_IFW "OFF")
set(CPACK_BINARY_NSIS "OFF")
set(CPACK_BINARY_RPM "OFF")
set(CPACK_BINARY_STGZ "ON")
set(CPACK_BINARY_TBZ2 "OFF")
set(CPACK_BINARY_TGZ "ON")
set(CPACK_BINARY_TXZ "OFF")
set(CPACK_BINARY_TZ "ON")
set(CPACK_BUILD_SOURCE_DIRS "/Users/deep/Documents/code/personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp;/Users/deep/Documents/code/personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/build-android/arm64")
set(CPACK_CMAKE_GENERATOR "Ninja")
set(CPACK_COMPONENTS_ALL "uvgrtp_Runtime;uvgrtp_Develop")
set(CPACK_COMPONENTS_ALL_SET_BY_USER "TRUE")
set(CPACK_COMPONENTS_GROUPING "ONE_PER_GROUP")
set(CPACK_COMPONENT_UNSPECIFIED_HIDDEN "TRUE")
set(CPACK_COMPONENT_UNSPECIFIED_REQUIRED "TRUE")
set(CPACK_DEBIAN_PACKAGE_MAINTAINER "jrsnen")
set(CPACK_DEBIAN_UVGRTP_DEVELOP_FILE_NAME "uvgrtp-3.1.6-dev.deb")
set(CPACK_DEBIAN_UVGRTP_RUNTIME_FILE_NAME "uvgrtp-3.1.6-arm64.deb")
set(CPACK_DEB_COMPONENT_INSTALL "TRUE")
set(CPACK_DEFAULT_PACKAGE_DESCRIPTION_FILE "/opt/homebrew/share/cmake/Templates/CPack.GenericDescription.txt")
set(CPACK_DEFAULT_PACKAGE_DESCRIPTION_SUMMARY "uvgrtp built using CMake")
set(CPACK_DMG_SLA_USE_RESOURCE_FILE_LICENSE "ON")
set(CPACK_GENERATOR "STGZ;TGZ;TZ")
set(CPACK_INNOSETUP_ARCHITECTURE "x64")
set(CPACK_INSTALL_CMAKE_PROJECTS "/Users/deep/Documents/code/personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/build-android/arm64;uvgrtp;ALL;/")
set(CPACK_INSTALL_PREFIX "/usr/local")
set(CPACK_MODULE_PATH "")
set(CPACK_NSIS_DISPLAY_NAME "uvgrtp")
set(CPACK_NSIS_INSTALLER_ICON_CODE "")
set(CPACK_NSIS_INSTALLER_MUI_ICON_CODE "")
set(CPACK_NSIS_INSTALL_ROOT "\$PROGRAMFILES")
set(CPACK_NSIS_PACKAGE_NAME "uvgrtp")
set(CPACK_NSIS_UNINSTALL_NAME "Uninstall")
set(CPACK_OBJCOPY_EXECUTABLE "/Users/deep/Library/Android/sdk/ndk/27.3.13750724/toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-objcopy")
set(CPACK_OBJDUMP_EXECUTABLE "/Users/deep/Library/Android/sdk/ndk/27.3.13750724/toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-objdump")
set(CPACK_OUTPUT_CONFIG_FILE "/Users/deep/Documents/code/personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/build-android/arm64/CPackConfig.cmake")
set(CPACK_PACKAGE_CONTACT "https://github.com/jrsnen")
set(CPACK_PACKAGE_DEFAULT_LOCATION "/")
set(CPACK_PACKAGE_DESCRIPTION_FILE "/Users/deep/Documents/code/personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/packaging/Description.txt")
set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "uvgRTP is an Real-Time Transport Protocol (RTP) library written in C++ with a focus on simple to use and high-efficiency media delivery over the internet")
set(CPACK_PACKAGE_FILE_NAME "uvgrtp-3.1.6-Android")
set(CPACK_PACKAGE_HOMEPAGE_URL "https://github.com/ultravideo/uvgRTP")
set(CPACK_PACKAGE_INSTALL_DIRECTORY "uvgrtp")
set(CPACK_PACKAGE_INSTALL_REGISTRY_KEY "uvgrtp")
set(CPACK_PACKAGE_NAME "uvgrtp")
set(CPACK_PACKAGE_RELOCATABLE "true")
set(CPACK_PACKAGE_VENDOR "Humanity")
set(CPACK_PACKAGE_VERSION "3.1.6")
set(CPACK_PACKAGE_VERSION_MAJOR "3")
set(CPACK_PACKAGE_VERSION_MINOR "1")
set(CPACK_PACKAGE_VERSION_PATCH "6")
set(CPACK_READELF_EXECUTABLE "/Users/deep/Library/Android/sdk/ndk/27.3.13750724/toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-readelf")
set(CPACK_RESOURCE_FILE_LICENSE "/Users/deep/Documents/code/personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/packaging/License.txt")
set(CPACK_RESOURCE_FILE_README "/Users/deep/Documents/code/personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/packaging/Readme.txt")
set(CPACK_RESOURCE_FILE_WELCOME "/Users/deep/Documents/code/personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/packaging/Welcome.txt")
set(CPACK_RPM_COMPONENT_INSTALL "TRUE")
set(CPACK_SET_DESTDIR "OFF")
set(CPACK_SOURCE_GENERATOR "TBZ2;TGZ;TXZ;TZ")
set(CPACK_SOURCE_IGNORE_FILES "/\\.git/;/\\.circleci/;/\\.idea/;\\.swp;\\.orig;/CMakeLists\\.txt\\.user;/privateDir/;/cmake\\-build.*/")
set(CPACK_SOURCE_OUTPUT_CONFIG_FILE "/Users/deep/Documents/code/personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/build-android/arm64/CPackSourceConfig.cmake")
set(CPACK_SOURCE_RPM "OFF")
set(CPACK_SOURCE_TBZ2 "ON")
set(CPACK_SOURCE_TGZ "ON")
set(CPACK_SOURCE_TXZ "ON")
set(CPACK_SOURCE_TZ "ON")
set(CPACK_SOURCE_ZIP "OFF")
set(CPACK_SYSTEM_NAME "Android")
set(CPACK_THREADS "1")
set(CPACK_TOPLEVEL_TAG "Android")
set(CPACK_VERBATIM_VARIABLES "YES")
set(CPACK_WIX_SIZEOF_VOID_P "8")

if(NOT CPACK_PROPERTIES_FILE)
  set(CPACK_PROPERTIES_FILE "/Users/deep/Documents/code/personal/pixl/frontend/pixl_clean/android/app/src/main/cpp/lib/uvgrtp/build-android/arm64/CPackProperties.cmake")
endif()

if(EXISTS ${CPACK_PROPERTIES_FILE})
  include(${CPACK_PROPERTIES_FILE})
endif()

# Configuration for component "uvgrtp_Runtime"
set(CPACK_COMPONENT_UVGRTP_RUNTIME_DISPLAY_NAME "Runtime")
set(CPACK_COMPONENT_UVGRTP_RUNTIME_INSTALL_TYPES Full Developer Minimal)
set(CPACK_COMPONENT_UVGRTP_RUNTIME_REQUIRED TRUE)

# Configuration for component "uvgrtp_Development"
set(CPACK_COMPONENT_UVGRTP_DEVELOPMENT_DISPLAY_NAME "Developer pre-requisites")
set(CPACK_COMPONENT_UVGRTP_DEVELOPMENT_DESCRIPTION "Headers needed for development")
set(CPACK_COMPONENT_UVGRTP_DEVELOPMENT_DEPENDS uvgrtp_Runtime)
set(CPACK_COMPONENT_UVGRTP_DEVELOPMENT_INSTALL_TYPES Full Developer)

# Configuration for component "uvgrtp_Samples"
set(CPACK_COMPONENT_UVGRTP_SAMPLES_DISPLAY_NAME "Code Samples")
set(CPACK_COMPONENT_UVGRTP_SAMPLES_INSTALL_TYPES Full Developer)
set(CPACK_COMPONENT_UVGRTP_SAMPLES_DISABLED TRUE)

# Configuration for installation type "Full"
list(APPEND CPACK_ALL_INSTALL_TYPES Full)

# Configuration for installation type "Minimal"
list(APPEND CPACK_ALL_INSTALL_TYPES Minimal)

# Configuration for installation type "Developer"
list(APPEND CPACK_ALL_INSTALL_TYPES Developer)
set(CPACK_INSTALL_TYPE_DEVELOPER_DISPLAY_NAME "SDK Development")
