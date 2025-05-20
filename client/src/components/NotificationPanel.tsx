import { useState } from 'react';
import { Notification, DataSource } from '@/types/aircraft';

interface NotificationPanelProps {
  notifications: Notification[];
  isLoading: boolean;
  onResolveNotification: (id: number) => Promise<Notification>;
  onSelectAircraftFromNotification: (aircraftId: number) => void;
  dataSources: DataSource[];
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  isLoading,
  onResolveNotification,
  onSelectAircraftFromNotification,
  dataSources
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'alerts' | 'info'>('all');
  
  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'alerts') return notification.priority === 'high';
    if (activeTab === 'info') return notification.priority !== 'high';
    return true;
  });
  
  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'collision': return 'warning';
      case 'handoff': return 'flight_takeoff';
      case 'airspace': return 'flight_land';
      case 'assistance': return 'priority_high';
      case 'system': return 'info';
      default: return 'notifications';
    }
  };
  
  // Get color for notification priority
  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-danger';
      case 'normal': return 'text-warning';
      case 'low': 
      default: return 'text-text-secondary';
    }
  };
  
  // Handle resolve notification
  const handleResolve = async (id: number) => {
    try {
      await onResolveNotification(id);
    } catch (error) {
      console.error('Error resolving notification:', error);
    }
  };
  
  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // If notification has associated aircraft, select it
    if (notification.aircraftIds && notification.aircraftIds.length > 0) {
      onSelectAircraftFromNotification(notification.aircraftIds[0]);
    }
  };

  return (
    <section className="w-1/6 border-l border-gray-800 flex flex-col bg-background">
      <div className="p-3 bg-surface border-b border-gray-800">
        <h2 className="text-lg font-medium mb-2">Notifications</h2>
        <div className="flex space-x-1">
          <button 
            className={`flex-1 py-1 rounded text-sm ${activeTab === 'all' ? 'bg-primary text-white' : 'hover:bg-surface-light'}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button 
            className={`flex-1 py-1 rounded text-sm ${activeTab === 'alerts' ? 'bg-primary text-white' : 'hover:bg-surface-light'}`}
            onClick={() => setActiveTab('alerts')}
          >
            Alerts
          </button>
          <button 
            className={`flex-1 py-1 rounded text-sm ${activeTab === 'info' ? 'bg-primary text-white' : 'hover:bg-surface-light'}`}
            onClick={() => setActiveTab('info')}
          >
            Info
          </button>
        </div>
      </div>
      
      <div className="overflow-y-auto custom-scrollbar flex-grow">
        {isLoading ? (
          <div className="p-4 text-center text-text-secondary">Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-4 text-center text-text-secondary">No notifications to display</div>
        ) : (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id} 
              className="p-3 border-b border-gray-700 hover:bg-surface-light"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start">
                <div className="mr-2 mt-0.5">
                  <i className={`material-icons ${getNotificationColor(notification.priority)}`}>
                    {getNotificationIcon(notification.type)}
                  </i>
                </div>
                <div>
                  <h3 className="font-medium">{notification.title}</h3>
                  <p className="text-sm text-text-secondary mb-2">{notification.message}</p>
                  {notification.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolve(notification.id);
                        }}
                        className={`px-2 py-1 ${
                          notification.priority === 'high' 
                            ? 'bg-danger' 
                            : notification.type === 'handoff' 
                              ? 'bg-primary' 
                              : notification.type === 'airspace'
                                ? 'bg-warning text-black'
                                : 'bg-primary'
                        } text-white text-xs rounded`}
                      >
                        {notification.type === 'collision' ? 'Resolve' : 
                         notification.type === 'handoff' ? 'Accept' :
                         notification.type === 'airspace' ? 'Reroute' : 'Acknowledge'}
                      </button>
                      <button 
                        onClick={(e) => e.stopPropagation()} 
                        className="px-2 py-1 bg-surface text-xs rounded"
                      >
                        {notification.type === 'handoff' ? 'Reject' : 'Details'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-surface border-t border-gray-800">
        <h3 className="font-medium mb-2">System Status</h3>
        <div className="space-y-2 text-sm">
          {dataSources.map(source => (
            <div key={source.id} className="flex justify-between">
              <span>{source.name} Data</span>
              <span className="flex items-center">
                <span className={`status-indicator ${
                  source.status === 'online' ? 'bg-success' : 
                  source.status === 'degraded' ? 'bg-warning' : 'bg-danger'
                } mr-1`}></span>
                <span>{source.status.charAt(0).toUpperCase() + source.status.slice(1)}</span>
              </span>
            </div>
          ))}
          <div className="flex justify-between">
            <span>ML Correlation</span>
            <span className="flex items-center">
              <span className={`status-indicator ${
                dataSources.some(s => s.status === 'online') ? 'bg-success' : 'bg-danger'
              } mr-1`}></span>
              <span>{dataSources.some(s => s.status === 'online') ? 'Active' : 'Inactive'}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotificationPanel;
