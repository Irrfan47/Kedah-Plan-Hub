import { useState, useEffect } from "react";
import { Bell, X, Check, Trash2, MessageSquare, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getNotifications, markNotificationAsRead, deleteNotification } from "@/api/backend";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: number;
  program_id?: string;
  program_name?: string;
  program_creator_name?: string;
  created_at: string;
}

export function NotificationDropdown() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await getNotifications(user.id);
      if (response.success) {
        setNotifications(response.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId?: string) => {
    if (!user?.id) return;

    try {
      const response = await markNotificationAsRead(user.id, notificationId);
      if (response.success) {
        toast({ title: "Success", description: "Notification marked as read" });
        fetchNotifications(); // Refresh notifications
      } else {
        toast({ title: "Error", description: response.message || "Failed to mark as read", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({ title: "Error", description: "Failed to mark as read", variant: "destructive" });
    }
  };

  const handleDeleteNotification = async (notificationId?: string) => {
    if (!user?.id) return;

    try {
      const response = await deleteNotification(user.id, notificationId);
      if (response.success) {
        toast({ title: "Success", description: "Notification deleted" });
        fetchNotifications(); // Refresh notifications
      } else {
        toast({ title: "Error", description: response.message || "Failed to delete", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'program_created':
        return <FileText className="w-4 h-4" />;
      case 'status_change':
        return <AlertCircle className="w-4 h-4" />;
      case 'remark_added':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'program_created':
        return 'text-blue-600 bg-blue-50';
      case 'status_change':
        return 'text-orange-600 bg-orange-50';
      case 'remark_added':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead()}
                    className="text-xs"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteNotification()}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="p-2">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      notification.is_read ? 'bg-gray-50' : 'bg-white'
                    } ${!notification.is_read ? 'border-blue-200' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          {notification.program_name && (
                            <p className="text-xs text-gray-500 mt-1">
                              Program: {notification.program_name}
                            </p>
                          )}
                          {notification.program_creator_name && (
                            <p className="text-xs text-gray-500">
                              By: {notification.program_creator_name}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 ml-2">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 