#include "uvgrtp/version.hh"

#include <cstdint>
#include <string>

namespace uvgrtp {

#ifdef RTP_RELEASE_COMMIT
    std::string get_version() { return "3.1.6-release"; }
#else
    std::string get_version() { return "3.1.6-60509d8"; }
#endif

uint16_t get_version_major() { return 3; }

uint16_t get_version_minor() { return 1; }

uint16_t get_version_patch() { return 6; }

std::string get_git_hash() {return "60509d8";}
} // namespace uvgrtp
