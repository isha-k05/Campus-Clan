const Message = require('../models/Message');
const User = require('../models/User');

const chatHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join a personal room based on user ID
    socket.on('join_personal', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their personal room`);
    });

    // Handle chat acceptance
    socket.on('accept_chat', (data) => {
      const { senderId, receiverId } = data;
      io.to(`user_${senderId}`).emit('chat_accepted', { receiverId });
    });

    // Handle chat decline
    socket.on('decline_chat', (data) => {
      const { senderId, receiverId } = data;
      io.to(`user_${senderId}`).emit('chat_declined', { receiverId });
    });

    // Join a group room
    socket.on('join_group', (groupId) => {
      socket.join(`group_${groupId}`);
      console.log(`User joined group room: group_${groupId}`);
    });

    // Handle sending a private message
    socket.on('send_private_message', async (data) => {
      const { senderId, receiverId, content } = data;
      
      try {
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver) return;

        // Rule 1: If receiver has declined sender, sender cannot send message
        if (receiver.declinedChats.some(id => id.toString() === senderId)) {
          return socket.emit('error', { message: 'You cannot message this user.' });
        }

        // Rule 3: If sender messages receiver, sender auto-accepts receiver
        let senderUpdated = false;
        if (!sender.acceptedChats.some(id => id.toString() === receiverId)) {
          sender.acceptedChats.push(receiverId);
          sender.declinedChats = sender.declinedChats.filter(id => id.toString() !== receiverId);
          await sender.save();
          senderUpdated = true;
        }

        // Rule 2: If receiver hasn't accepted sender, sender can only send ONE message initially
        if (!receiver.acceptedChats.some(id => id.toString() === senderId)) {
          const messageCount = await Message.countDocuments({
            sender: senderId,
            receiver: receiverId
          });
          if (messageCount >= 1) {
            return socket.emit('error', { message: 'Wait for the user to accept your request.' });
          }
        }

        const message = await Message.create({
          sender: senderId,
          receiver: receiverId,
          content
        });

        const popMessage = await Message.findById(message._id).populate('sender', 'name profilePicture');

        // Emit to receiver's personal room
        io.to(`user_${receiverId}`).emit('receive_private_message', popMessage);
        // Emit back to sender
        socket.emit('receive_private_message', popMessage);
        
        // If sender was updated (auto-accepted), notify them
        if (senderUpdated) {
          socket.emit('user_updated', sender);
        }
      } catch (err) {
        console.error('Error sending message', err);
      }
    });

    // Handle sending a group message
    socket.on('send_group_message', async (data) => {
      const { senderId, groupId, content } = data;
      
      try {
        const message = await Message.create({
          sender: senderId,
          group: groupId,
          content
        });

        const popMessage = await Message.findById(message._id).populate('sender', 'name profilePicture');

        // Emit to group room
        io.to(`group_${groupId}`).emit('receive_group_message', popMessage);
      } catch (err) {
        console.error('Error sending group message', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = chatHandler;
