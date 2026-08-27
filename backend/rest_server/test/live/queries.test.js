const { test } = require("node:test");
const assert = require("node:assert/strict");

const OBJECT_ID = /^[a-fA-F0-9]{24}$/;
function isObjectId(id) {
  return typeof id === "string" && OBJECT_ID.test(id);
}

test("accepts mongo object ids and rejects java stream ids", () => {
  assert.equal(isObjectId("6a90aa69eebc610f0c4db99f"), true);
  assert.equal(isObjectId("pixl-chat-729957947571500"), false);
  assert.equal(isObjectId("83eb8af1-b4d2-419b-8107-e7ba950d43a0"), false);
  assert.equal(isObjectId(""), false);
});
