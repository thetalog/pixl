#include <jni.h>
#include <cstdint>
#include <android/log.h>
#include <algorithm>
#include "rtsp_serve.h"

#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, "PIXEL_JNI", __VA_ARGS__)
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO,  "PIXEL_JNI", __VA_ARGS__)

static inline uint8_t clamp_int(int v) {
    return static_cast<uint8_t>(v < 0 ? 0 : (v > 255 ? 255 : v));
}

extern "C"
JNIEXPORT jint JNICALL
Java_com_nativebridge_pixl_MainActivity_convertToARGB(
    JNIEnv *env, jobject thiz,
    jbyteArray src_y, jint src_stride_y,
    jbyteArray src_u, jint src_stride_u,
    jbyteArray src_v, jint src_stride_v,
    jbyteArray dst_argb, jint dst_stride_argb,
    jint width, jint height) {

    if (!src_y || !src_u || !src_v || !dst_argb) {
        LOGE("Null array(s) passed");
        return -1;
    }
    if (width <= 0 || height <= 0 || dst_stride_argb < width * 4) {
        LOGE("Invalid dims or dst_stride_argb");
        return -2;
    }

    jsize dstLen = env->GetArrayLength(dst_argb);
    if (dstLen < width * height * 4) {
        LOGE("dst_argb too small: %d < %d", dstLen, width * height * 4);
        return -3;
    }

    // pin arrays
    jbyte* y_ptr = env->GetByteArrayElements(src_y, nullptr);
    jbyte* u_ptr = env->GetByteArrayElements(src_u, nullptr);
    jbyte* v_ptr = env->GetByteArrayElements(src_v, nullptr);
    jbyte* dst_ptr = env->GetByteArrayElements(dst_argb, nullptr);

    if (!y_ptr || !u_ptr || !v_ptr || !dst_ptr) {
        LOGE("Failed to get array elements");
        if (y_ptr) env->ReleaseByteArrayElements(src_y, y_ptr, JNI_ABORT);
        if (u_ptr) env->ReleaseByteArrayElements(src_u, u_ptr, JNI_ABORT);
        if (v_ptr) env->ReleaseByteArrayElements(src_v, v_ptr, JNI_ABORT);
        return -4;
    }

    const uint8_t* y = reinterpret_cast<const uint8_t*>(y_ptr);
    const uint8_t* u = reinterpret_cast<const uint8_t*>(u_ptr);
    const uint8_t* v = reinterpret_cast<const uint8_t*>(v_ptr);
    uint8_t* dst = reinterpret_cast<uint8_t*>(dst_ptr);

// The Dart side packs I420 (Y, U, V contiguous planes) before calling JNI.
// So treat the incoming U/V as separate planes (U then V). If you later add
// NV21 support (interleaved VU), add a separate code path.
bool useVU = false; // assume I420 layout (U then V)

for (int row = 0; row < height; ++row) {
    int yRowBase = row * src_stride_y;
    int uvRow = row / 2;
    int uRowBase = uvRow * src_stride_u;
    int vRowBase = uvRow * src_stride_v;
    int dstRowBase = row * dst_stride_argb;

    for (int col = 0; col < width; ++col) {
        int yIndex = yRowBase + col;
        int uvCol = col / 2;
        int uIndex = uRowBase + uvCol;
        int vIndex = vRowBase + uvCol;

        int Y = static_cast<int>(y[yIndex]) & 0xFF;
        int U = 0, V = 0;

        // For I420 (what the Dart/Camera packing produces): U plane then V plane
        U = static_cast<int>(v[vIndex]) & 0xFF;
        V = static_cast<int>(u[uIndex]) & 0xFF;

        int c = Y - 16;
        int d = U - 128;
        int e = V - 128;

        int r = (298 * c + 409 * e + 128) >> 8;
        int g = (298 * c - 100 * d - 208 * e + 128) >> 8;
        int b = (298 * c + 516 * d + 128) >> 8;

    // Write out in BGRA order to match the Dart/image package expectation
    // (ChannelOrder.bgra expects bytes: B, G, R, A).
    dst[dstRowBase + col * 4 + 0] = clamp_int(b);
    dst[dstRowBase + col * 4 + 1] = clamp_int(g);
    dst[dstRowBase + col * 4 + 2] = clamp_int(r);
    dst[dstRowBase + col * 4 + 3] = 0xFF; // A
    }
    }

// Try flipping layout after one frame if grayscale persists
    LOGI("convertToARGB done: %dx%d (mode: %s)", width, height, useVU ? "NV21" : "I420");
    env->ReleaseByteArrayElements(src_y, y_ptr, JNI_ABORT);
    env->ReleaseByteArrayElements(src_u, u_ptr, JNI_ABORT);
    env->ReleaseByteArrayElements(src_v, v_ptr, JNI_ABORT);
    env->ReleaseByteArrayElements(dst_argb, dst_ptr, 0);

    LOGI("✅ convertToARGB done: %dx%d", width, height);
    return 0;
}

extern "C"
JNIEXPORT jbyteArray JNICALL
Java_com_nativebridge_pixl_MainActivity_yuv420ToJpeg(
        JNIEnv *env, jobject thiz,
        jbyteArray src_y, jbyteArray src_u, jbyteArray src_v,
        jint width, jint height,
        jint stride_y, jint stride_u, jint stride_v) {

    jbyte *y = env->GetByteArrayElements(src_y, nullptr);
    jbyte *u = env->GetByteArrayElements(src_u, nullptr);
    jbyte *v = env->GetByteArrayElements(src_v, nullptr);

    const int ySize = width * height;
    const int uvSize = (width / 2) * (height / 2);
    const int nv21Size = ySize + 2 * uvSize;
    jbyteArray nv21Array = env->NewByteArray(nv21Size);
    jbyte *nv21 = env->GetByteArrayElements(nv21Array, nullptr);

    // Copy Y
    memcpy(nv21, y, ySize);

    // Interleave V and U (NV21)
    int uvOffset = ySize;
    for (int i = 0; i < uvSize; i++) {
        nv21[uvOffset + i * 2] = v[i];
        nv21[uvOffset + i * 2 + 1] = u[i];
    }

    // Create YuvImage and compress to JPEG
    jclass yuvImageClass = env->FindClass("android/graphics/YuvImage");
    jmethodID ctor = env->GetMethodID(yuvImageClass, "<init>", "([BIII[I)V");
    jobject yuvImage = env->NewObject(yuvImageClass, ctor, nv21Array, 17, width, height, nullptr);

    jclass rectClass = env->FindClass("android/graphics/Rect");
    jmethodID rectCtor = env->GetMethodID(rectClass, "<init>", "(IIII)V");
    jobject rect = env->NewObject(rectClass, rectCtor, 0, 0, width, height);

    jclass baosClass = env->FindClass("java/io/ByteArrayOutputStream");
    jmethodID baosCtor = env->GetMethodID(baosClass, "<init>", "()V");
    jobject baos = env->NewObject(baosClass, baosCtor);

    jmethodID compressMid = env->GetMethodID(yuvImageClass, "compressToJpeg",
                                             "(Landroid/graphics/Rect;ILjava/io/OutputStream;)Z");
    env->CallBooleanMethod(yuvImage, compressMid, rect, 100, baos);

    jmethodID toByteArrayMid = env->GetMethodID(baosClass, "toByteArray", "()[B");
    jbyteArray jpegBytes = (jbyteArray)env->CallObjectMethod(baos, toByteArrayMid);

    env->ReleaseByteArrayElements(src_y, y, JNI_ABORT);
    env->ReleaseByteArrayElements(src_u, u, JNI_ABORT);
    env->ReleaseByteArrayElements(src_v, v, JNI_ABORT);
    env->ReleaseByteArrayElements(nv21Array, nv21, JNI_ABORT);

    return jpegBytes;
}
