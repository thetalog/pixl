#include "encode_raw.h"
#include "rtsp_serve.h"

static std::mutex encoderReleaseMutex;

int releaseEncoders() {
  std::lock_guard<std::mutex> lk(encoderReleaseMutex);

  for (int i = 0; i < MAX_ENCODING_VECTOR; i++) {
    encoderVector[i].clear();
  }

  LOGI_RTP("RELEASED ENCODERS");
  return 0;
}

// JNI wrapper
extern "C" JNIEXPORT void JNICALL Java_com_nativebridge_pixl_MainActivity_nativeReleaseEncoders() { releaseEncoders(); }
