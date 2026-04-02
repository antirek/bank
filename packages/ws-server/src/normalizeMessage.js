import { User } from '@boqq/shared/models';

/** Формат как у GET /dialogs/:id/messages (user-api). */
export async function normalizeMessageCreate(message, boqqUserId) {
  const senderId = message.senderId;
  const users = senderId
    ? await User.find({ mms3UserId: { $in: [senderId] } })
    : [];
  const userMap = {};
  users.forEach((u) => {
    if (u.mms3UserId) userMap[u.mms3UserId] = u;
  });

  const currentUser = await User.findOne({ userId: boqqUserId });
  const currentUserMms3Id =
    currentUser?.mms3UserId || boqqUserId.replace(/\./g, '_');

  return {
    messageId: message.messageId,
    senderId: message.senderId,
    senderName:
      userMap[senderId]?.name ||
      userMap[senderId]?.phone ||
      message.senderInfo?.name ||
      'Unknown',
    isOwn: message.senderId === currentUserMms3Id,
    content: message.content,
    type: message.type,
    createdAt: message.createdAt,
    status: message.statuses?.[0]?.status || 'sent'
  };
}
