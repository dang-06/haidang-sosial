import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setnotifications } from '@/redux/notificationSlice'; // Nếu bạn muốn thêm tính năng xóa thông báo

const Notification = () => {
  const dispatch = useDispatch();
  const notifications = useSelector((store) => store.notification.notifications);

  // Hàm xóa thông báo
  const handleDeleteNotification = (id) => {
    dispatch(setnotifications(notifications.filter(notification => notification.id !== id)));
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-md">
      <h2 className="text-xl font-semibold mb-4">Thông Báo</h2>
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center text-gray-500">Không có thông báo mới</div>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className="flex items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200">
              <div className="flex-1">
                <h3 className="font-medium text-lg">{notification.title}</h3>
                <p className="text-gray-600">{notification.message}</p>
              </div>
              <span className="text-sm text-gray-500">{notification.time}</span>
              <button
                onClick={() => handleDeleteNotification(notification.id)}
                className="ml-4 text-red-500 hover:text-red-700"
              >
                Xóa
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notification;
