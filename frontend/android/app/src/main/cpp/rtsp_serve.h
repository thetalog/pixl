#ifndef RTSP_SERVE_H
#define RTSP_SERVE_H

// Android logging
#include <android/log.h>
#define LOGI_RTP(...) __android_log_print(ANDROID_LOG_INFO, "PIXLRTP", __VA_ARGS__)

// JNI
#include <jni.h>

// uvgRTP
#include <memory>
#include <string>
#include <uvgrtp/lib.hh>
#include <uvgrtp/media_stream.hh>
#include <uvgrtp/session.hh>
#include <uvgrtp/util.hh>
#include <vector>

// Shortcut alias (official in uvgRTP)
namespace uvg_rtp = uvgrtp;

// -------------------------
// NAL Unit Struct
// -------------------------
struct NALUnit {
  std::vector<uint8_t> data;  // Annex-B **removed**
};

// -------------------------
// Function declarations
// -------------------------
void setup_uvgrtp_sender();

void send_rtp_stream(const NALUnit& nal);

// Check if RTP is ready
bool is_rtp_initialized();

extern "C" JNIEXPORT void JNICALL
Java_com_nativebridge_pixl_MainActivity_nativeStartRtspServerBackground(
    JNIEnv* env, jobject thiz);

#endif