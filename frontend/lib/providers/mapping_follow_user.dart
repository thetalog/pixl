import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../connections/connection.dart';

final mappingFollowUserProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return await {"targetUser": "", "followStatus": FollowStatus.PENDING};
});
