import 'package:flutter_dotenv/flutter_dotenv.dart';

class Config {
  static String get baseUrl {
    final url = dotenv.env['BASE_URL'];
    if (url == null || url.isEmpty) {
      throw Exception('BASE_URL not found in .env file');
    }
    return url;
  }

  /// Helper method to build API URLs
  static String buildApiUrl(String endpoint) {
    final base = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;
    final path = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    return '$base$path';
  }
}
