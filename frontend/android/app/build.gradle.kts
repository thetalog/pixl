plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

repositories {
    flatDir {
        dirs("libs")
    }
}

android {
    namespace = "com.nativebridge.pixl"
    compileSdk = 36
    ndkVersion = "27.3.13750724"
    defaultConfig {
        applicationId = "com.nativebridge.pixl"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        // Only build for arm64-v8a (uvgrtp only built for this ABI)
        // cppFlags and abiFilters are configured in externalNativeBuild at top level


        ndk {
            abiFilters += listOf("arm64-v8a")
        }
    }

    splits {
        abi {
            reset()
            include("arm64-v8a")
            isUniversalApk = false
        }
    }

    packaging {
        jniLibs {
            pickFirsts.add("**/*.so")
        }

        resources {
            excludes.addAll(
                listOf(
                    "META-INF/INDEX.LIST",
                    "META-INF/DEPENDENCIES",
                    "META-INF/io.netty.versions.properties",
                    "META-INF/LICENSE",
                    "META-INF/LICENSE.txt",
                    "META-INF/NOTICE",
                    "META-INF/NOTICE.txt",
                    "META-INF/*.SF",
                    "META-INF/*.DSA",
                    "META-INF/*.RSA"
                )
            )
        }
    }



    // externalNativeBuild {
    //     cmake {
    //         path = file("CMakeLists.txt")
    //         version = "3.22.1"

    //     }
    // }

    buildFeatures {
        prefab = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlin {
        jvmToolchain(17)
    }

    tasks.whenTaskAdded {
        if (name.contains("mergeDebugNativeLibs") || name.contains("mergeReleaseNativeLibs")) {
            println("✅ Packaging native libs into APK…")
        }
    }
}

/**
 * ✅ FIX DUPLICATE CLASSES:
 * - remove all old android support libs
 * - remove old pedroSG94 rtmp/rtsp libs that conflict
 * - force one encoder stack version
 */
configurations.all {

    // remove old android support libs
    exclude(group = "com.android.support")
    exclude(group = "com.android.support.constraint")

    // remove old Pedro lib (rtmp-rtsp-stream-client-java:encoder/rtsp 1.9.6)
    exclude(group = "com.github.pedroSG94.rtmp-rtsp-stream-client-java")

    resolutionStrategy {
        force("com.github.pedroSG94.RootEncoder:encoder:2.6.7")
        force("com.github.pedroSG94.RootEncoder:rtsp:2.6.7")
    }
}

flutter {
    source = "../.."
}

dependencies {
    implementation(fileTree(mapOf("dir" to "libs", "include" to listOf("*.jar"))))
    implementation("org.kurento:kurento-client:7.1.0")
}
