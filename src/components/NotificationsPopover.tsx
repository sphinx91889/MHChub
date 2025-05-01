import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import SimpleModal from './SimpleModal';

export default function NotificationsPopover() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications] = React.useState([
    {
      id: 1,
      title: 'New Task Assigned',
      description: 'Review client documentation for Tiffany Cherie Hermet',
      time: '2 hours ago',
      type: 'task',
      isRead: false,
    },
    {
      id: 2,
      title: 'Client Review Submitted',
      description: 'A new 5-star review has been submitted',
      time: '5 hours ago',
      type: 'review',
      isRead: true,
    },
    {
      id: 3,
      title: 'Onboarding Completed',
      description: 'Client onboarding process has been completed',
      time: '1 day ago',
      type: 'onboarding',
      isRead: true,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-white/30 relative"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      <SimpleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Notifications"
      >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg transition-colors ${
                  notification.isRead ? 'bg-gray-50' : 'bg-blue-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 p-2 rounded-full ${
                    notification.type === 'task' ? 'bg-blue-100 text-blue-600' :
                    notification.type === 'review' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {notification.type === 'task' ? '✓' :
                     notification.type === 'review' ? '⭐' : '📋'}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                    <span className="text-xs text-gray-500 mt-2 block">{notification.time}</span>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <button className="text-sm text-gray-600 hover:text-gray-900">
              Mark all as read
            </button>
            <button className="text-sm text-primary-600 hover:text-primary-700">
              View all notifications
            </button>
          </div>
      </SimpleModal>
    </>
  );
}