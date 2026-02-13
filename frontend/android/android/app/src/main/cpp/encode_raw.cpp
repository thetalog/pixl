#include "encode_raw.h"
#include "rtsp_serve.h"

#include <android/log.h>
#include <jni.h>

#include <cxxabi.h>
#include <dlfcn.h>
#include <mutex>
#include <optional>
#include <stdexcept>
#include <thread>
#include <unordered_map>
#include <vector>

#define LOG_TAG "PIXLENCODE"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)

// ======================================================
// SAFE any_cast WRAPPER
// ======================================================
template <typename T> T safeAnyCast(const std::any &value, const char *file, int line) {
  try {
    return std::any_cast<T>(value);
  } catch (const std::bad_any_cast &) {
    LOGI("bad_any_cast at %s:%d", file, line);
    throw;
  }
}
#define SAFE_ANY_CAST(T, v) safeAnyCast<T>(v, __FILE__, __LINE__)

// ======================================================
// GLOBALS
// ======================================================
static x265_param *param = nullptr;
static x265_encoder *encoder = nullptr;
static bool encoderInitialized = false;
static bool rtpInitialized = false;

static std::mutex encoderMutex;
size_t available_encoder_identity = 0;

// ======================================================
// ENCODER INITIALIZATION
// ======================================================
void init_encoder(int width, int height) {
    if (encoderInitialized)
        return;

    param = x265_param_alloc();

    // Use preset (required)
    if (x265_param_default_preset(param, "veryfast", nullptr) < 0) {
        LOGI("Failed preset");
        return;
    }

    param->sourceWidth  = width;
    param->sourceHeight = height;
    param->fpsNum = 30;
    param->fpsDenom = 1;

    param->internalCsp = X265_CSP_I420;

    encoder = x265_encoder_open(param);
    if (!encoder) {
        LOGI("Failed to open encoder");
        return;
    }

    encoderInitialized = true;
    LOGI("x265 Encoder Initialized");
}


// ======================================================
// ENCODER SHUTDOWN
// ======================================================
void close_encoder() {
  std::lock_guard<std::mutex> lock(encoderMutex);

  if (!encoderInitialized)
    return;

  x265_encoder_close(encoder);
  encoder = nullptr;

  if (param) {
    x265_param_free(param);
    param = nullptr;
  }

  encoderInitialized = false;
  LOGI("Encoder closed");
}

// ======================================================
// ANNEX B START CODE DETECTION
// ======================================================
int annexb_startcode_length(const uint8_t *p) {
  if (!p)
    return 0;
  if (p[0] == 0 && p[1] == 0 && p[2] == 0 && p[3] == 1)
    return 4;
  if (p[0] == 0 && p[1] == 0 && p[2] == 1)
    return 3;
  return 0;
}

// ======================================================
// FLUSH ENCODED FRAMES
// ======================================================
void flush_encoded_frames() {
    std::lock_guard<std::mutex> lock(encoderMutex);

    x265_nal *nals = nullptr;
    uint32_t nalCount = 0;

    while (true) {
        int ret = x265_encoder_encode(encoder, &nals, &nalCount, nullptr, nullptr);
        if (ret <= 0) break;

        for (uint32_t i = 0; i < nalCount; i++) {
            uint8_t *p = nals[i].payload;
            uint32_t size = nals[i].sizeBytes;

            int sc = annexb_startcode_length(p);
            uint8_t *raw = p + sc;
            uint32_t raw_size = size - sc;

            if (raw_size < 2) {
                LOGI("Skipping tiny flushed NAL (size=%u)", raw_size);
                continue;
            }

            uint8_t nalType = (raw[0] >> 1) & 0x3F;
            LOGI("Flushed NAL type=%u size=%u", nalType, raw_size);

            NALUnit nal{};
            nal.data.insert(nal.data.end(), raw, raw + raw_size);
            send_rtp_stream(nal);
        }
    }

    LOGI("Flushed all frames");
}



// ======================================================
// MAIN ENCODE PER FRAME
// ======================================================
void encode_raw_from_buffers(uint8_t *Y, uint8_t *U, uint8_t *V, int width, int height) {
    std::lock_guard<std::mutex> lock(encoderMutex);

    if (!encoderInitialized)
        init_encoder(width, height);

    // ensure RTP initialized once
    if (!rtpInitialized) {
        setup_uvgrtp_sender();
        rtpInitialized = true;
        LOGI("RTP sender initialized");
    }

    x265_picture pic;
    x265_picture_init(param, &pic);

    pic.bitDepth   = 8;
    pic.colorSpace = X265_CSP_I420;

    pic.planes[0] = Y;
    pic.planes[1] = U;
    pic.planes[2] = V;

    pic.stride[0] = width;
    pic.stride[1] = width / 2;
    pic.stride[2] = width / 2;

    x265_nal *nals = nullptr;
    uint32_t nalCount = 0;

    int ret = x265_encoder_encode(encoder, &nals, &nalCount, &pic, nullptr);
    if (ret < 0) {
        LOGI("Encode error: %d", ret);
        return;
    }

    for (uint32_t i = 0; i < nalCount; i++) {
        uint8_t *p = nals[i].payload;
        uint32_t size = nals[i].sizeBytes;

        int sc = annexb_startcode_length(p);
        uint8_t *data = p + sc;
        uint32_t dataSize = size - sc;

        if (dataSize < 2) {
            LOGI("Dropping tiny NAL (size=%u)", dataSize);
            continue;
        }

        uint8_t nalType = (data[0] >> 1) & 0x3F;
        LOGI("Encoded NAL: type=%u size=%u", nalType, dataSize);

        NALUnit sendNAL;
        sendNAL.data.insert(sendNAL.data.end(), data, data + dataSize);

        // send via RTP
        send_rtp_stream(sendNAL);
    }
}



// ======================================================
// JNI BRIDGE
// ======================================================
extern "C" JNIEXPORT void JNICALL Java_com_nativebridge_pixl_MainActivity_nativeEncodeRaw(
    JNIEnv *env, jobject, jbyteArray y, jbyteArray u, jbyteArray v, jint w, jint h) {

  jbyte *Y = env->GetByteArrayElements(y, nullptr);
  jbyte *U = env->GetByteArrayElements(u, nullptr);
  jbyte *V = env->GetByteArrayElements(v, nullptr);

  encode_raw_from_buffers(reinterpret_cast<uint8_t *>(Y), reinterpret_cast<uint8_t *>(U), reinterpret_cast<uint8_t *>(V), w, h);

  env->ReleaseByteArrayElements(y, Y, JNI_ABORT);
  env->ReleaseByteArrayElements(u, U, JNI_ABORT);
  env->ReleaseByteArrayElements(v, V, JNI_ABORT);
}

extern "C" JNIEXPORT void JNICALL Java_com_nativebridge_pixl_MainActivity_nativeFlushEncodedFrames(JNIEnv *, jobject) {
  flush_encoded_frames();
}
