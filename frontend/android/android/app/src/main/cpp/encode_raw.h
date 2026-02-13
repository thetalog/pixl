#ifndef GLOBALS_H
#define GLOBALS_H
#include <android/log.h>
#include <any>
#include <encoder/encoder.h>
#include <mutex>
#include <unordered_map>
#include <vector>
const int MAX_ENCODING_VECTOR = 4;
extern size_t available_encoder_identity;
// alias for function pointer type
using EncodeFunc = int (*)(x265_encoder *, x265_nal **, uint32_t *, x265_picture *, x265_picture *);
// Hash for enum class so unordered_map<EncoderVectorEnum, ...> works
enum class EncoderVectorEnum { RETURN, FUNCTION, FRAME_COUNT, IS_FLUSHED, NALS, NALS_COUNT, ENCODER_IDENTITY };
struct EnumHash {
  std::size_t operator()(EncoderVectorEnum e) const noexcept { return std::hash<int>()(static_cast<int>(e)); }
};
extern std::vector<std::unordered_map<EncoderVectorEnum, std::any, EnumHash>> encoderVector;
// static std::vector<std::unordered_map<EncoderVectorEnum, std::any, EnumHash>> *encoderVectorPtr;

#endif
