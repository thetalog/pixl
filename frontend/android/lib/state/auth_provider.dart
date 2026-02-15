import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _secureStorage = FlutterSecureStorage();

final tokenProvider = FutureProvider<String?>((ref) async {
  return await _secureStorage.read(key: "jwt_token");
});
final profileProvider =
    AsyncNotifierProvider<ProfileNotifier, String?>(ProfileNotifier.new);

class ProfileNotifier extends AsyncNotifier<String?> {
  @override
  Future<String?> build() async {
    return await _secureStorage.read(key: 'profile_username');
  }

  Future<void> updateUsername(String username) async {
    state = const AsyncLoading();

    await _secureStorage.write(
      key: 'profile_username',
      value: username,
    );

    state = AsyncData(username);
  }

  Future<void> clear() async {
    await _secureStorage.delete(key: 'profile_username');
    state = const AsyncData("");
  }
}
