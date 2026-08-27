#include "encode_raw.h"
#include <any>
#include <cxxabi.h>
#include <dlfcn.h>
#include <jni.h>
#include <sstream>

std::vector<std::unordered_map<EncoderVectorEnum, std::any, EnumHash>> encoderVector;
#define LOGI_RAW(...) __android_log_print(ANDROID_LOG_INFO, "PIXLENCODE", __VA_ARGS__)

std::string getFunctionAddress(void *addr) {
  std::ostringstream ss;
  ss << "0x" << std::hex << (uintptr_t)addr;
  return ss.str();
}

int initEncoders() {
  try {
    static std::mutex encoderInitMutex;
    std::lock_guard<std::mutex> lk(encoderInitMutex);

    encoderVector.clear();
    // encoderVector.reserve(MAX_ENCODING_VECTOR);
    encoderVector.reserve(4);
    for (int i = 0; i < MAX_ENCODING_VECTOR; i++) {
      std::unordered_map<EncoderVectorEnum, std::any, EnumHash> entries;

      entries[EncoderVectorEnum::RETURN] = -1;
      entries[EncoderVectorEnum::FUNCTION] = (EncodeFunc)x265_encoder_encode;
      entries[EncoderVectorEnum::FRAME_COUNT] = 0;
      entries[EncoderVectorEnum::IS_FLUSHED] = false;
      entries[EncoderVectorEnum::NALS] = nullptr;
      entries[EncoderVectorEnum::NALS_COUNT] = (uint32_t)0;
      entries[EncoderVectorEnum::ENCODER_IDENTITY] = i;

      encoderVector.push_back(entries);
    }
    std::unordered_map<EncoderVectorEnum, std::any, EnumHash> *anyValue = &encoderVector[0];
    std::any &anyVal = anyValue->at(EncoderVectorEnum::FUNCTION);

    LOGI_RAW("\x1B[31m INIT HERE------------------------------------------------------------- %p \033[0m", &anyVal);

    // encoderVectorPtr = std::any_cast<EncodeFunc>(&anyVal);
    getFunctionAddress(&anyVal);
    return 1;
  } catch (const std::exception &e) {
    std::stringstream ss;
    ss << "FAILED INIT ENCODERS: " << e.what();
    std::string s = ss.str();
    return -1;
  }
}
extern "C" JNIEXPORT jint JNICALL Java_com_nativebridge_pixl_MainActivity_nativeInitEncoders(JNIEnv *env, jobject thiz) {
  return initEncoders();
}
