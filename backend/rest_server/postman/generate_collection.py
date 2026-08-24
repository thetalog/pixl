#!/usr/bin/env python3
import json
from pathlib import Path

BASE = "{{baseUrl}}"


def hdr_json(auth=False):
    h = [{"key": "Content-Type", "value": "application/json"}]
    if auth:
        h.append({"key": "Authorization", "value": "Bearer {{jwt}}"})
    return h


def hdr_auth():
    return [{"key": "Authorization", "value": "Bearer {{jwt}}"}]


def make_url(path, query=None):
    raw = f"{BASE}{path}"
    url = {
        "raw": raw,
        "host": ["{{baseUrl}}"],
        "path": [p for p in path.strip("/").split("/") if p],
    }
    if query:
        url["query"] = [
            {
                "key": q["key"],
                "value": str(q.get("value", "")),
                "description": q.get("description", ""),
            }
            for q in query
        ]
        raw += "?" + "&".join(f"{q['key']}={q.get('value', '')}" for q in query)
        url["raw"] = raw
    return url


def req(
    name,
    method,
    path,
    *,
    auth=False,
    body=None,
    query=None,
    formdata=None,
    description="",
):
    item = {
        "name": name,
        "request": {
            "method": method,
            "header": [],
            "url": make_url(path, query),
            "description": description,
        },
        "response": [],
    }
    if auth:
        item["request"]["auth"] = {
            "type": "bearer",
            "bearer": [{"key": "token", "value": "{{jwt}}", "type": "string"}],
        }
    if formdata is not None:
        item["request"]["header"] = hdr_auth() if auth else []
        item["request"]["body"] = {"mode": "formdata", "formdata": formdata}
    elif body is not None:
        item["request"]["header"] = hdr_json(auth)
        item["request"]["body"] = {
            "mode": "raw",
            "raw": json.dumps(body, indent=2),
            "options": {"raw": {"language": "json"}},
        }
    elif auth:
        item["request"]["header"] = hdr_auth()
    return item


def folder(name, items):
    return {"name": name, "item": items}


collection = {
    "info": {
        "name": "Pixl REST API",
        "description": (
            "Importable Postman collection for Pixl backend (backend/rest_server).\n\n"
            "1. Set `baseUrl` (e.g. https://api.pixl-personal-project.online)\n"
            "2. Call Auth → Login\n"
            "3. Copy JWT from response into `jwt` variable\n"
            "4. Protected routes use Bearer {{jwt}}"
        ),
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    "variable": [
        {"key": "baseUrl", "value": "https://api.pixl-personal-project.online"},
        {"key": "jwt", "value": ""},
        {"key": "postId", "value": "REPLACE_POST_ID"},
        {"key": "reelId", "value": "REPLACE_REEL_ID"},
        {"key": "storyId", "value": "REPLACE_STORY_ID"},
        {"key": "liveId", "value": "REPLACE_LIVE_ID"},
        {"key": "groupId", "value": "REPLACE_GROUP_ID"},
        {"key": "messageId", "value": "REPLACE_MESSAGE_ID"},
        {"key": "username", "value": "alice"},
        {"key": "bucket", "value": "pixl-posts"},
        {"key": "objectKey", "value": "userId/1/file.jpg"},
    ],
    "item": [],
}

collection["item"].append(
    folder(
        "0. Health",
        [req("GET /", "GET", "/", description="Health check — returns Hi there!!")],
    )
)

collection["item"].append(
    folder(
        "1. Auth (public)",
        [
            req(
                "Send OTP",
                "POST",
                "/send-otp",
                body={"name": "Jane Doe", "email": "jane@example.com"},
            ),
            req(
                "Verify OTP",
                "POST",
                "/verify-otp",
                body={"email": "jane@example.com", "otp": 123456},
            ),
            req(
                "Signup",
                "POST",
                "/auth/signup",
                body={
                    "name": "Jane Doe",
                    "dateOfBirth": "2000-01-15",
                    "email": "jane@example.com",
                    "password": "secret123",
                    "userName": "janedoe",
                },
            ),
            req(
                "Login",
                "POST",
                "/auth/login",
                body={"email": "jane@example.com", "password": "secret123"},
                description="Copy returned JWT into collection variable `jwt`.",
            ),
        ],
    )
)

collection["item"].append(
    folder(
        "2. Notifications (public)",
        [
            req(
                "Send FCM",
                "POST",
                "/send",
                body={
                    "token": "fcm_device_token_xxxx",
                    "title": "Hello",
                    "body": "Notification text",
                    "data": {"type": "post", "id": "123"},
                },
            ),
            req(
                "Bulk FCM",
                "POST",
                "/bulk",
                body={
                    "notifications": [
                        {
                            "token": "fcm_device_token_xxxx",
                            "title": "Hello",
                            "body": "Text",
                            "data": {},
                        }
                    ]
                },
            ),
        ],
    )
)

collection["item"].append(
    folder(
        "3. Posts",
        [
            req(
                "Create post",
                "POST",
                "/posts/create-post",
                auth=True,
                formdata=[
                    {
                        "key": "file",
                        "type": "file",
                        "src": [],
                        "description": "Up to 10 files (same field name)",
                    },
                    {"key": "caption", "value": "Hello world", "type": "text"},
                    {"key": "location", "value": "Mumbai", "type": "text"},
                    {
                        "key": "tags",
                        "value": '["travel","food"]',
                        "type": "text",
                    },
                    {
                        "key": "taggedUsers",
                        "value": '["alice"]',
                        "type": "text",
                    },
                ],
            ),
            req(
                "Create reel",
                "POST",
                "/posts/create-reel",
                auth=True,
                formdata=[
                    {
                        "key": "file",
                        "type": "file",
                        "src": [],
                        "description": "Video only",
                    },
                    {
                        "key": "data",
                        "type": "text",
                        "value": json.dumps(
                            {
                                "musicCredit": "Original audio",
                                "tags": ["dance"],
                                "caption": "My reel",
                                "taggedUsers": ["alice"],
                            }
                        ),
                    },
                ],
            ),
            req(
                "Create story",
                "POST",
                "/posts/create-stories",
                auth=True,
                formdata=[
                    {"key": "file", "type": "file", "src": []},
                    {
                        "key": "data",
                        "type": "text",
                        "value": json.dumps(
                            {
                                "taggedUsers": ["alice"],
                                "location": None,
                                "caption": "",
                                "tags": [],
                            }
                        ),
                    },
                ],
            ),
            req(
                "Edit caption",
                "PATCH",
                "/posts/edit-caption",
                auth=True,
                body={"postId": "{{postId}}", "newCaption": "Updated caption"},
            ),
            req(
                "Update post",
                "PATCH",
                "/posts/{{postId}}",
                auth=True,
                body={
                    "caption": "New caption",
                    "location": {"name": "Goa"},
                    "userTags": ["travel"],
                    "taggedUsers": ["alice"],
                },
            ),
            req("Get all public posts", "GET", "/posts/get-all-public-posts", auth=True),
            req(
                "Get all public reels",
                "GET",
                "/posts/get-all-public-reels",
                auth=True,
                query=[{"key": "skip", "value": "0"}, {"key": "take", "value": "20"}],
            ),
            req(
                "Get single public post",
                "GET",
                "/posts/get-single-public-post",
                auth=True,
                query=[{"key": "postId", "value": "{{postId}}"}],
            ),
            req("Get followed posts", "GET", "/posts/get-followed-posts", auth=True),
            req(
                "Get posts by UI category",
                "GET",
                "/posts/get-all-public-posts-by-ui-category",
                auth=True,
                query=[
                    {
                        "key": "category",
                        "value": "MUSIC",
                        "description": "IGTV|SHOP|STYLE|SPORTS|AUTO|MUSIC|MOVIES|UNSET",
                    }
                ],
            ),
            req(
                "Get posts by tag",
                "GET",
                "/posts/by-tag",
                auth=True,
                query=[{"key": "tag", "value": "travel"}],
            ),
            req("Get saved posts", "GET", "/posts/saved", auth=True),
            req(
                "Comment on post",
                "POST",
                "/posts/{{postId}}/comment",
                auth=True,
                body={"commentText": "Nice post!"},
            ),
            req(
                "Comment on reel",
                "POST",
                "/posts/{{reelId}}/reel-comment",
                auth=True,
                body={"commentText": "Fire reel!"},
            ),
            req(
                "Get post comments",
                "GET",
                "/posts/comments",
                auth=True,
                query=[
                    {"key": "postId", "value": "{{postId}}"},
                    {"key": "skip", "value": "0"},
                    {"key": "take", "value": "20"},
                ],
            ),
            req(
                "Get reel comments",
                "GET",
                "/posts/reel-comments",
                auth=True,
                query=[
                    {"key": "reelId", "value": "{{reelId}}"},
                    {"key": "skip", "value": "0"},
                    {"key": "take", "value": "20"},
                ],
            ),
            req(
                "Like / unlike post",
                "PATCH",
                "/posts/like-or-unlike/{{postId}}",
                auth=True,
            ),
            req(
                "Save / unsave post",
                "PATCH",
                "/posts/save-or-unsave/{{postId}}",
                auth=True,
            ),
            req(
                "Like / unlike reel",
                "PATCH",
                "/posts/reel/like-or-unlike/{{reelId}}",
                auth=True,
            ),
            req(
                "Update system tags",
                "POST",
                "/posts/{{postId}}/system-tags",
                auth=True,
                body={"systemTags": ["sunset", "beach"]},
            ),
            req(
                "Update UI category",
                "POST",
                "/posts/{{postId}}/update-ui-category/MUSIC",
                auth=True,
                description="Path category: IGTV|SHOP|STYLE|SPORTS|AUTO|MUSIC|MOVIES|UNSET",
            ),
            req(
                "Generate share link",
                "GET",
                "/posts/generate-post-share-link",
                auth=True,
                query=[{"key": "postId", "value": "{{postId}}"}],
            ),
            req(
                "Get followed stories",
                "GET",
                "/posts/get-all-followed-stories",
                auth=True,
            ),
            req(
                "Seen story",
                "POST",
                "/posts/seen-stories",
                auth=True,
                query=[{"key": "storyId", "value": "{{storyId}}"}],
                description="storyId is a QUERY param",
            ),
            req("React story", "PATCH", "/posts/react-story/{{storyId}}", auth=True),
        ],
    )
)

collection["item"].append(
    folder(
        "4. Messages — Direct",
        [
            req(
                "Send direct message",
                "POST",
                "/message/direct/send-message",
                auth=True,
                formdata=[
                    {
                        "key": "files",
                        "type": "file",
                        "src": [],
                        "description": "Optional",
                    },
                    {
                        "key": "postData",
                        "type": "text",
                        "value": json.dumps(
                            {"receiverUsername": "alice", "message": "Hey!"}
                        ),
                    },
                ],
            ),
            req(
                "Get direct messages",
                "GET",
                "/message/direct/messages",
                auth=True,
                query=[
                    {"key": "targetUsername", "value": "{{username}}"},
                    {"key": "skip", "value": "0"},
                    {"key": "take", "value": "50"},
                ],
            ),
            req(
                "Get direct conversations",
                "GET",
                "/message/direct/conversations",
                auth=True,
            ),
            req(
                "React direct message",
                "PUT",
                "/message/direct/react-direct-message",
                auth=True,
                body={
                    "senderUsername": "alice",
                    "messageId": "{{messageId}}",
                    "emoji": "🔥",
                },
            ),
            req(
                "Retract direct message",
                "DELETE",
                "/message/direct/retract-direct-message",
                auth=True,
                body={
                    "receiverUsername": "alice",
                    "messageId": "{{messageId}}",
                },
            ),
            req(
                "Seen direct messages",
                "PATCH",
                "/message/direct/seen-direct-message",
                auth=True,
                body={"senderUsername": "alice"},
            ),
        ],
    )
)

collection["item"].append(
    folder(
        "5. Messages — Group",
        [
            req(
                "Create group",
                "POST",
                "/message/group/create-group",
                auth=True,
                formdata=[
                    {
                        "key": "file",
                        "type": "file",
                        "src": [],
                        "description": "Group DP required",
                    },
                    {
                        "key": "postData",
                        "type": "text",
                        "value": json.dumps(
                            {
                                "groupName": "Weekend Squad",
                                "addedUsernames": ["alice", "bob"],
                            }
                        ),
                    },
                ],
            ),
            req(
                "Send group message",
                "POST",
                "/message/send-message",
                auth=True,
                formdata=[
                    {
                        "key": "files",
                        "type": "file",
                        "src": [],
                        "description": "Optional",
                    },
                    {
                        "key": "postData",
                        "type": "text",
                        "value": json.dumps(
                            {"groupId": "{{groupId}}", "message": "Hello group"}
                        ),
                    },
                ],
                description="Mounted at /message/send-message (not under /group)",
            ),
            req(
                "Get group messages",
                "GET",
                "/message/group/messages",
                auth=True,
                query=[
                    {"key": "groupId", "value": "{{groupId}}"},
                    {"key": "skip", "value": "0"},
                    {"key": "take", "value": "50"},
                ],
            ),
            req(
                "Get group conversations",
                "GET",
                "/message/group/conversations",
                auth=True,
            ),
            req(
                "React group message",
                "PUT",
                "/message/group/react-message",
                auth=True,
                body={
                    "groupId": "{{groupId}}",
                    "messageId": "{{messageId}}",
                    "emoji": "👍",
                },
            ),
            req(
                "Retract group message",
                "DELETE",
                "/message/group/retract-message",
                auth=True,
                body={"groupId": "{{groupId}}", "messageId": "{{messageId}}"},
            ),
            req(
                "Seen group messages",
                "PATCH",
                "/message/group/seen-message",
                auth=True,
                body={"groupId": "{{groupId}}"},
            ),
        ],
    )
)

collection["item"].append(
    folder(
        "6. Users & Follow",
        [
            req(
                "Check username",
                "POST",
                "/users/check-username",
                auth=True,
                body={"userName": "janedoe"},
            ),
            req(
                "Search profile by username",
                "GET",
                "/users/search/get-profile-by-username",
                auth=True,
                query=[{"key": "username", "value": "{{username}}"}],
            ),
            req(
                "Search users",
                "GET",
                "/users/search/all",
                auth=True,
                query=[
                    {
                        "key": "q",
                        "value": "alice",
                        "description": "or username / name",
                    }
                ],
            ),
            req("Own profile", "GET", "/users/profile", auth=True),
            req(
                "Follow request",
                "POST",
                "/users/follow/request",
                auth=True,
                body={"targetUsername": "{{username}}"},
            ),
            req(
                "Approve follow",
                "POST",
                "/users/follow/approve",
                auth=True,
                body={"requestId": "req_123", "requesterUsername": "alice"},
            ),
            req(
                "Reject follow",
                "POST",
                "/users/follow/reject",
                auth=True,
                body={"requestId": "req_123", "requesterUsername": "alice"},
            ),
            req(
                "Incoming follow requests",
                "GET",
                "/users/get-incoming-follow-request",
                auth=True,
            ),
            req(
                "Remove follow request",
                "PATCH",
                "/users/remove-follow-request",
                auth=True,
                query=[{"key": "targetUsername", "value": "{{username}}"}],
            ),
            req(
                "Remove following / unfollow",
                "PATCH",
                "/users/remove-following",
                auth=True,
                query=[{"key": "targetUsername", "value": "{{username}}"}],
            ),
            req(
                "Get follow status",
                "GET",
                "/users/get-follow-status",
                auth=True,
                query=[{"key": "targetUsername", "value": "{{username}}"}],
            ),
            req(
                "Get followers",
                "GET",
                "/users/followers",
                auth=True,
                query=[{"key": "username", "value": "{{username}}"}],
            ),
            req(
                "Get following",
                "GET",
                "/users/following",
                auth=True,
                query=[{"key": "username", "value": "{{username}}"}],
            ),
            req(
                "Toggle profile visibility",
                "PATCH",
                "/users/change-profile-visibility",
                auth=True,
            ),
        ],
    )
)

collection["item"].append(
    folder(
        "7. Profile",
        [
            req(
                "Update profile (query params)",
                "POST",
                "/profile/update",
                auth=True,
                query=[
                    {"key": "name", "value": "Jane Doe"},
                    {"key": "about", "value": "Bio text"},
                    {"key": "oldPassword", "value": ""},
                    {"key": "newPassword", "value": ""},
                ],
                description="Fields are QUERY params, not JSON body.",
            ),
            req(
                "Update profile picture",
                "POST",
                "/profile/picture",
                auth=True,
                formdata=[{"key": "file", "type": "file", "src": []}],
            ),
        ],
    )
)

collection["item"].append(
    folder(
        "8. Live",
        [
            req(
                "Start live",
                "POST",
                "/live/start",
                auth=True,
                body={"title": "My live stream"},
            ),
            req("Get live", "GET", "/live/{{liveId}}", auth=True),
            req("End live", "DELETE", "/live/{{liveId}}", auth=True),
            req("Join live", "POST", "/live/{{liveId}}/join", auth=True),
            req("Leave live", "POST", "/live/{{liveId}}/leave", auth=True),
            req(
                "Add live comment",
                "POST",
                "/live/{{liveId}}/comment",
                auth=True,
                body={"text": "Great stream!"},
            ),
            req("Get live comments", "GET", "/live/{{liveId}}/comments", auth=True),
            req(
                "Live comments socket info",
                "GET",
                "/live/{{liveId}}/comments/socket",
                auth=True,
            ),
        ],
    )
)

collection["item"].append(
    folder(
        "9. Storage",
        [
            req(
                "Proxy media",
                "GET",
                "/storage/{{bucket}}/{{objectKey}}",
                description="Public GET. Example: /storage/pixl-posts/userId/1/file.jpg",
            ),
        ],
    )
)

out = Path(
    "/Users/deeprajdas/Documents/Pixl/pixl/backend/rest_server/postman/Pixl_API.postman_collection.json"
)
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(collection, indent=2))
print(f"Wrote {out}")
print(f"Folders: {len(collection['item'])}")
print(f"Requests: {sum(len(f['item']) for f in collection['item'])}")
