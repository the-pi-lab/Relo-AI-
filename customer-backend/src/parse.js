// Meta webhook payload parsing with early filtering.
// Drops anything that can never trigger automation BEFORE any DB write:
// wrong object type, missing ids, self-comments/sends, message echoes,
// deleted/unsupported and textless messages (an autoreply containing its own
// keyword must never retrigger itself).

export function parseCommentEvents(payload) {
  const events = [];
  if (!payload || payload.object !== "instagram") return events;
  for (const entry of payload.entry ?? []) {
    const accountId = entry.id;
    for (const change of entry.changes ?? []) {
      if (change.field !== "comments") continue;
      const value = change.value || {};
      const commentId = value.id ?? value.comment_id;
      const mediaId = value.media?.id ?? value.media_id;
      const commenterId = value.from?.id;
      if (!accountId || !commentId || !mediaId || !commenterId) continue;
      if (commenterId === accountId) continue; // own comment
      events.push({
        accountId,
        commentId,
        text: value.text ?? "",
        commenterId,
        commenterName: value.from?.username,
        mediaId,
      });
    }
  }
  return events;
}

export function parseMessageEvents(payload) {
  const events = [];
  if (!payload || payload.object !== "instagram") return events;
  for (const entry of payload.entry ?? []) {
    const accountId = entry.id;
    for (const item of entry.messaging ?? []) {
      const message = item.message;
      if (!message) continue;
      if (message.is_echo || message.is_deleted || message.is_unsupported) {
        continue;
      }
      const senderId = item.sender?.id;
      const recipientId = item.recipient?.id ?? accountId;
      if (!senderId || !recipientId) continue;
      if (senderId === accountId) continue; // own send
      const text = (message.text ?? "").trim();
      if (!text) continue;
      events.push({
        accountId: accountId ?? recipientId,
        senderId,
        messageId: message.mid,
        text,
      });
    }
  }
  return events;
}
