import { io, getReceiverSocketId } from "../socket/socket.js";

export const SocketService = {};

SocketService.sendNotification = async (receiverId, notificationData) => {
  const receiverSocketId = getReceiverSocketId(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("notification", notificationData);
  } else {
    console.log("User offline, storing notification in DB");
  }
};