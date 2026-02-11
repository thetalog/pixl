// rtsp_main.cpp
#include <dlfcn.h>
#include <stdio.h>

int main() {
    void* handle = dlopen("librtsp_serve.so", RTLD_NOW);
    if (!handle) {
        printf("dlopen error: %s\n", dlerror());
        return 1;
    }

    typedef void (*func_t)();
    func_t start_rtp_stream = (func_t)dlsym(handle, "start_rtp_stream");
    if (!start_rtp_stream) {
        printf("dlsym error: %s\n", dlerror());
        dlclose(handle);
        return 1;
    }

    printf("Calling start_rtp_stream...\n");
    start_rtp_stream();

    dlclose(handle);
    return 0;
}
