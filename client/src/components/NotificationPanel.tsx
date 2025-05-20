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
    <section className="flex flex-col w-full h-full">
      <div className="panel-header">
        <h2 className="panel-title">Notifications</h2>
        <div className="flex space-x-1">
          <span className={`relative flex h-2.5 w-2.5 ${
            filteredNotifications.filter(n => n.priority === 'high').length > 0 ? '' : 'hidden'
          }`}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
          </span>
        </div>
      </div>
      
      <div className="flex border-b border-border">
        <button 
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all' ? 'border-primary text-primary' : 'border-transparent hover:border-muted-foreground/20'
          }`}
          onClick={() => setActiveTab('all')}
        >
          All ({notifications.length})
        </button>
        <button 
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'alerts' ? 'border-primary text-primary' : 'border-transparent hover:border-muted-foreground/20'
          }`}
          onClick={() => setActiveTab('alerts')}
        >
          Alerts ({notifications.filter(n => n.priority === 'high').length})
        </button>
        <button 
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent hover:border-muted-foreground/20'
          }`}
          onClick={() => setActiveTab('info')}
        >
          Info ({notifications.filter(n => n.priority !== 'high').length})
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            <svg className="animate-spin h-5 w-5 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 mb-2 text-muted-foreground/50" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            No notifications to display
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id} 
              className="border-b border-border p-3 hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex gap-3">
                <div className="shrink-0 mt-0.5">
                  {notification.type === 'collision' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  ) : notification.type === 'handoff' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 9l14-5 -5 14-3-8z"/>
                    </svg>
                  ) : notification.type === 'airspace' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[hsl(var(--partially-verified))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                  ) : notification.type === 'assistance' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[hsl(var(--assistance))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{notification.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{notification.message}</p>
                  {notification.status === 'pending' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolve(notification.id);
                        }}
                        className={`px-2 py-1 text-xs rounded-md ${
                          notification.priority === 'high' 
                            ? 'bg-destructive text-destructive-foreground' 
                            : 'bg-primary text-primary-foreground' 
                        }`}
                      >
                        {notification.type === 'collision' ? 'Resolve' : 
                         notification.type === 'handoff' ? 'Accept' :
                         notification.type === 'airspace' ? 'Reroute' : 'Acknowledge'}
                      </button>
                      <button 
                        onClick={(e) => e.stopPropagation()} 
                        className="px-2 py-1 bg-secondary text-xs rounded-md"
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

      <div className="sticky bottom-0 p-3 border-t border-border bg-muted/50">
        <h3 className="text-sm font-medium mb-3">System Status</h3>
        <div className="space-y-2">
          {dataSources.map(source => (
            <div key={source.id} className="flex justify-between items-center">
              <span className="text-sm">{source.name} Data</span>
              <span className={`system-status ${
                source.status === 'online' ? 'operational' : 
                source.status === 'degraded' ? 'degraded' : 'offline'
              }`}>
                {source.status.charAt(0).toUpperCase() + source.status.slice(1)}
              </span>
            </div>
          ))}
          <div className="flex justify-between items-center">
            <span className="text-sm">ML Correlation</span>
            <span className={`system-status ${
              dataSources.some(s => s.status === 'online') ? 'operational' : 'offline'
            }`}>
              {dataSources.some(s => s.status === 'online') ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotificationPanel;
