import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Notification, NOTAM, DataSource } from '@/types/aircraft';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, AlertCircle, CheckCircle, Info, WifiOff } from 'lucide-react';

interface TabbedNotificationPanelProps {
  notifications: Notification[];
  notams: NOTAM[];
  isLoadingNotifications: boolean;
  isLoadingNOTAMs: boolean;
  onResolveNotification: (id: number) => Promise<Notification> | void;
  onSelectAircraftFromNotification: (aircraftId: number) => void;
  dataSources: DataSource[];
  selectedARTCC: string;
}

export default function TabbedNotificationPanel({
  notifications,
  notams,
  isLoadingNotifications,
  isLoadingNOTAMs,
  onResolveNotification,
  onSelectAircraftFromNotification,
  dataSources,
  selectedARTCC
}: TabbedNotificationPanelProps) {
  const [activeTab, setActiveTab] = useState("notifications");
  const [filter, setFilter] = useState<string>('all');

  // Filter notifications based on status
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'pending') return notification.status === 'pending';
    if (filter === 'resolved') return notification.status === 'resolved';
    if (filter === 'high') return notification.priority === 'high';
    return true;
  });

  // Filter NOTAMs based on active status and ARTCC
  const filteredNOTAMs = notams.filter(notam => {
    if (!notam.isActive) return false;
    if (selectedARTCC && notam.location !== selectedARTCC) return false;
    return true;
  });

  // Get count of pending notifications for badge
  const pendingCount = notifications.filter(n => n.status === 'pending').length;
  const activeNotamCount = filteredNOTAMs.length;

  // Get status of data sources for system status panel
  const onlineSources = dataSources.filter(ds => ds.status === 'online').length;
  const offlineSources = dataSources.filter(ds => ds.status === 'offline').length;
  const degradedSources = dataSources.filter(ds => ds.status === 'degraded').length;

  // Handle notification resolution
  const handleResolveNotification = async (id: number) => {
    await onResolveNotification(id);
  };

  // Render notification icon based on type
  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'collision':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'airspace':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'handoff':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'system':
        return <WifiOff className="h-4 w-4 text-gray-500" />;
      case 'assistance':
        return <AlertCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Render priority badge
  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'normal':
        return <Badge variant="outline">Normal</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  // Render NOTAM severity badge
  const renderSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="outline">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Information Panel</h2>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications" className="text-xs">
            Notifications
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notams" className="text-xs">
            NOTAMs
            {activeNotamCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeNotamCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs">System Status</TabsTrigger>
        </TabsList>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications" className="h-[calc(100vh-12rem)] overflow-y-auto">
          <div className="mb-2 flex justify-between">
            <div className="space-x-1">
              <Button
                size="sm"
                variant={filter === 'all' ? "default" : "outline"}
                onClick={() => setFilter('all')}
                className="text-xs h-7 px-2"
              >
                All
              </Button>
              <Button
                size="sm"
                variant={filter === 'pending' ? "default" : "outline"}
                onClick={() => setFilter('pending')}
                className="text-xs h-7 px-2"
              >
                Pending
              </Button>
              <Button
                size="sm"
                variant={filter === 'high' ? "default" : "outline"}
                onClick={() => setFilter('high')}
                className="text-xs h-7 px-2"
              >
                High Priority
              </Button>
            </div>
          </div>
          
          {isLoadingNotifications ? (
            <div className="flex justify-center items-center h-20">
              <span>Loading notifications...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="mx-auto h-6 w-6 mb-2" />
              <p>No notifications to display</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <Card key={notification.id} className={`p-3 ${notification.status === 'resolved' ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      {renderNotificationIcon(notification.type)}
                      <span className="ml-2 font-medium">{notification.title}</span>
                    </div>
                    {renderPriorityBadge(notification.priority)}
                  </div>
                  <p className="text-sm mt-1">{notification.message}</p>
                  
                  <div className="flex justify-between mt-2">
                    <div>
                      {notification.aircraftIds && notification.aircraftIds.length > 0 && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs h-7"
                          onClick={() => onSelectAircraftFromNotification(notification.aircraftIds[0])}
                        >
                          View Aircraft
                        </Button>
                      )}
                    </div>
                    
                    {notification.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="default"
                        className="text-xs h-7"
                        onClick={() => handleResolveNotification(notification.id)}
                      >
                        Resolve
                      </Button>
                    )}
                    
                    {notification.status === 'resolved' && (
                      <Badge variant="outline" className="text-xs">
                        Resolved
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* NOTAMs Tab */}
        <TabsContent value="notams" className="h-[calc(100vh-12rem)] overflow-y-auto">
          {isLoadingNOTAMs ? (
            <div className="flex justify-center items-center h-20">
              <span>Loading NOTAMs...</span>
            </div>
          ) : filteredNOTAMs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="mx-auto h-6 w-6 mb-2" />
              <p>No active NOTAMs for {selectedARTCC || 'selected region'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNOTAMs.map((notam) => (
                <Card key={notam.id} className="p-3">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <Info className="h-4 w-4 text-amber-500" />
                      <span className="ml-2 font-medium">{notam.title}</span>
                    </div>
                    {renderSeverityBadge(notam.severity)}
                  </div>
                  
                  <p className="text-sm mt-1">{notam.message}</p>
                  
                  <div className="flex flex-wrap justify-between mt-2 text-xs text-muted-foreground">
                    <span>Location: {notam.location}</span>
                    <span>Type: {notam.type}</span>
                    <span>Valid: {new Date(notam.startDate).toLocaleDateString()} - {notam.endDate ? new Date(notam.endDate).toLocaleDateString() : 'Indefinite'}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* System Status Tab */}
        <TabsContent value="system" className="h-[calc(100vh-12rem)] overflow-y-auto">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Data Source Status</h3>
            <div className="space-y-2">
              {dataSources.map((source) => (
                <div key={source.id} className="flex justify-between items-center">
                  <span>{source.name}</span>
                  <Badge 
                    variant={
                      source.status === 'online' ? 'default' : 
                      source.status === 'degraded' ? 'secondary' : 'destructive'
                    }
                    className={
                      source.status === 'online' ? 'bg-green-500 hover:bg-green-600' : 
                      source.status === 'degraded' ? 'bg-amber-500 hover:bg-amber-600' : ''
                    }
                  >
                    {source.status.charAt(0).toUpperCase() + source.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="font-semibold mb-2">System Summary</h3>
            <div className="grid grid-cols-3 gap-2">
              <Card className="p-2 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="text-center">
                  <CheckCircle className="w-4 h-4 mx-auto text-green-500" />
                  <p className="text-sm font-medium">Online</p>
                  <p className="text-xl font-bold">{onlineSources}</p>
                </div>
              </Card>
              
              <Card className="p-2 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <div className="text-center">
                  <AlertCircle className="w-4 h-4 mx-auto text-amber-500" />
                  <p className="text-sm font-medium">Degraded</p>
                  <p className="text-xl font-bold">{degradedSources}</p>
                </div>
              </Card>
              
              <Card className="p-2 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <div className="text-center">
                  <WifiOff className="w-4 h-4 mx-auto text-red-500" />
                  <p className="text-sm font-medium">Offline</p>
                  <p className="text-xl font-bold">{offlineSources}</p>
                </div>
              </Card>
            </div>
            
            <Separator className="my-4" />
            
            <h3 className="font-semibold mb-2">Selected ARTCC</h3>
            <p>{selectedARTCC || 'None selected'}</p>
            
            <Separator className="my-4" />
            
            <h3 className="font-semibold mb-2">GNSS Status</h3>
            <div className="flex items-center">
              {dataSources.some(ds => ds.name === 'GNSS' && ds.status === 'online') ? (
                <>
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                  <span>Operational</span>
                </>
              ) : dataSources.some(ds => ds.name === 'GNSS' && ds.status === 'degraded') ? (
                <>
                  <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                  <span>Degraded Performance</span>
                </>
              ) : (
                <>
                  <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                  <span>Unavailable</span>
                </>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}