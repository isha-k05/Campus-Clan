const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['follow', 'message_request', 'like', 'comment', 'group_invite', 'group_join_request', 'group_join_allowed', 'group_join_denied', 'group_invite_denied', 'group_kicked'], required: true },
  isRead: { type: Boolean, default: false },
  data: { type: Object } // Extra info like postId or groupId if needed
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
