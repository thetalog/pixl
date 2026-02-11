#include "rtsp_serve.h"

#include <android/log.h>
#include <jni.h>

#include <memory>
#include <string>
#include <uvgrtp/lib.hh>
#include <uvgrtp/media_stream.hh>
#include <uvgrtp/session.hh>
#include <uvgrtp/util.hh>

#include "rtsp_serve.h"

#define LOGI_RTP(...) __android_log_print(ANDROID_LOG_INFO, "PIXLRTP", __VA_ARGS__)

static std::unique_ptr<uvg_rtp::context> g_ctx;
static uvgrtp::session *g_session = nullptr;
static uvgrtp::media_stream *g_stream = nullptr;
static bool g_rtp_initialized = false;

// ---------------------------------------------------

size_t strip_start_code(const uint8_t *p, size_t len) {
  if (len >= 4 && p[0] == 0 && p[1] == 0 && p[2] == 0 && p[3] == 1)
    return 4;
  if (len >= 3 && p[0] == 0 && p[1] == 0 && p[2] == 1)
    return 3;
  return 0;
}
// -------------------------
// Configuration
// -------------------------
constexpr uint16_t LOCAL_PORT = 5006;
constexpr uint16_t REMOTE_PORT = 5004;
bool is_rtp_initialized() { return g_rtp_initialized && (bool)g_stream; }

void setup_uvgrtp_sender() {
  if (g_rtp_initialized) {
    LOGI_RTP("RTP already initialized, skipping setup");
    return;
  }

  try {
    LOGI_RTP("Setting up uvgRTP sender...");

    // Create context (keep it alive in global unique_ptr)
    g_ctx = std::make_unique<uvg_rtp::context>();
    if (!g_ctx) {
      LOGI_RTP("ERROR: Failed to create uvgRTP context");
      return;
    }

    // Create session with proper parameters
    // Parameters: local IP, remote IP, port, protocol
    // Use 0.0.0.0 to let the OS pick the local interface
    const std::string LOCAL_ADDR = "192.168.1.15";
    const std::string REMOTE_ADDR = "192.168.1.5"; // Use loopback for testing
    const int PORT = 5004;

    // Create session: use pair(local, remote)
    g_session = g_ctx->create_session(REMOTE_ADDR, LOCAL_ADDR);
    if (!g_session) {
      LOGI_RTP("ERROR: Failed to create uvgRTP session");
      return;
    }

    LOGI_RTP("Session created: local=%s remote=%s port=%d", LOCAL_ADDR.c_str(), REMOTE_ADDR.c_str(), PORT);
    auto flags = RTP_CTX_ENABLE_FLAGS::RCE_FRAGMENT_GENERIC;
    // Create media stream (H.265 video)
    g_stream = g_session->create_stream(LOCAL_PORT, REMOTE_PORT, RTP_FORMAT_H264, flags);
    if (!g_stream) {
      LOGI_RTP("ERROR: Failed to create media stream");
      return;
    }
    g_stream->configure_ctx(RCC_MTU_SIZE, 1492);
    LOGI_RTP("Media stream created successfully");
    g_rtp_initialized = true;

  } catch (const std::exception &e) {
    LOGI_RTP("EXCEPTION in setup_uvgrtp_sender: %s", e.what());
    g_rtp_initialized = false;
  } catch (...) {
    LOGI_RTP("UNKNOWN EXCEPTION in setup_uvgrtp_sender");
    g_rtp_initialized = false;
  }
}

void send_rtp_stream(const NALUnit &nal) {
  if (!g_rtp_initialized || !g_stream) {
    LOGI_RTP("RTP not initialized, cannot send NAL");
    return;
  }
    LOGI_RTP("NAL size=%zu, header=%02X %02X",
     nal.data.size(),
     nal.data[0],
     nal.data[1]);


  try {
    // Send NAL unit (without Annex-B start code, as per NALUnit struct)
    int ret = g_stream->push_frame((uint8_t *)nal.data.data(), nal.data.size(), RTP_NO_H26X_SCL);

    if (ret != RTP_OK) {
      LOGI_RTP("\e[32m ERROR: Failed to push frame, error code: %d \e[0m", ret);
    } else {
      LOGI_RTP("\e[32m NAL sent successfully, size=%zu \e[0m", nal.data.size());
    }

  } catch (const std::exception &e) {
    LOGI_RTP("EXCEPTION in send_rtp_stream: %s", e.what());
  }
}

extern "C" JNIEXPORT void JNICALL Java_com_nativebridge_pixl_MainActivity_nativeStartRtspServerBackground(JNIEnv *env, jobject thiz) {
  LOGI_RTP("JNI: nativeStartRtspServerBackground called");
  setup_uvgrtp_sender();
}
