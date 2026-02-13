# pixl_clean

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

docker run --rm \
    -p 8890:8888/tcp \
    -p 5000-5050:5000-5050/udp \
    -e KMS_MIN_PORT=5000 \
    -e KMS_MAX_PORT=5050 \
    kurento/kurento-media-server:7.3.0

# Stop existing container
docker stop kurento-media-server 2>/dev/null
docker rm kurento-media-server 2>/dev/null

# Run with host network so it uses your machine's IP
docker run -d --name kurento-media-server \
  --network host \
  kurento/kurento-media-server:latest

# Verify it's running
docker ps

db.getCollection("Media").updateMany(
  {},
  [
    {
      $set: {
        url: {
          $replaceAll: {
            input: "$url",
            find: "192.168.1.2",
            replacement: "192.168.31.8"
          }
        },
        thumbnail: {
          $replaceAll: {
            input: "$thumbnail",
            find: "192.168.1.2",
            replacement: "192.168.31.8"
          }
        }
      }
    }
  ]
);
