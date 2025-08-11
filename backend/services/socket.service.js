import { io, getReceiverSocketId } from "../socket/socket.js";

export const SocketService = {};

SocketService.sendNotification = async (receiverId, notificationData) => {
  console.log("receiverId: ", receiverId)
  const receiverSocketId = getReceiverSocketId(receiverId);
  console.log("receiverSocketId: ", receiverSocketId)

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("notification", notificationData);
  } else {
    console.log("User offline, storing notification in DB");
  }
};