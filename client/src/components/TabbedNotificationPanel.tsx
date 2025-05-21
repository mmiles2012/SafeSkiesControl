import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotificationPanel from './NotificationPanel';
import NOTAMPanel from './NOTAMPanel';
import { Notification, Aircraft, DataSource, NOTAM } from '@/types/aircraft';

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

const TabbedNotificationPanel: React.FC<TabbedNotificationPanelProps> = ({
  notifications,
  notams,
  isLoadingNotifications,
  isLoadingNOTAMs,
  onResolveNotification,
  onSelectAircraftFromNotification,
  dataSources,
  selectedARTCC
}) => {
  const [activeTab, setActiveTab] = useState<string>('notifications');

  return (
    <div className="h-full flex flex-col">
      <Tabs 
        defaultValue="notifications" 
        className="w-full h-full flex flex-col"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <div className="p-2 border-b border-border">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications" className="text-sm font-medium">
              Notifications
              {notifications.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                  {notifications.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="notams" className="text-sm font-medium">
              NOTAMs
              {notams.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                  {notams.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="notifications" className="flex-1 p-0 m-0 overflow-y-auto">
          <NotificationPanel
            notifications={notifications}
            isLoading={isLoadingNotifications}
            onResolveNotification={onResolveNotification}
            onSelectAircraftFromNotification={onSelectAircraftFromNotification}
            dataSources={dataSources}
          />
        </TabsContent>

        <TabsContent value="notams" className="flex-1 p-0 m-0 overflow-y-auto">
          <NOTAMPanel
            notams={notams}
            isLoading={isLoadingNOTAMs}
            selectedARTCC={selectedARTCC}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TabbedNotificationPanel;