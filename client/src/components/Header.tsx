import React from 'react';
import { DataSource } from '../types/aircraft';

interface HeaderProps {
  title: string;
  currentUser: {
    displayName: string;
    initials: string;
  };
  systemStatus: 'operational' | 'degraded' | 'offline';
  dataSources: DataSource[];
  onOpenSettings: () => void;
  onOpenFilters: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  currentUser,
  systemStatus,
  dataSources,
  onOpenSettings,
  onOpenFilters
}) => {
  // Determine overall system status
  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-success';
      case 'degraded':
        return 'bg-warning';
      case 'offline':
        return 'bg-danger';
      default:
        return 'bg-muted';
    }
  };

  const getSystemStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'All Systems Operational';
      case 'degraded':
        return 'System Performance Degraded';
      case 'offline':
        return 'System Offline';
      default:
        return 'Status Unknown';
    }
  };

  return (
    <header className="bg-surface py-2 px-4 flex items-center justify-between border-b border-gray-800">
      <div className="flex items-center">
        <span className="text-xl font-medium">{title}</span>
        <div className="ml-6 flex space-x-4">
          <button 
            onClick={onOpenSettings}
            className="px-3 py-1 rounded bg-surface-light hover:bg-opacity-80">
            Map Settings
          </button>
          <button 
            onClick={onOpenFilters}
            className="px-3 py-1 rounded bg-surface-light hover:bg-opacity-80">
            Filters
          </button>
          <button className="px-3 py-1 rounded bg-primary hover:bg-opacity-80">
            System Status
          </button>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center bg-surface-light rounded-full px-3 py-1">
          <span className={`status-indicator ${getSystemStatusColor(systemStatus)} mr-2`}></span>
          <span>{getSystemStatusText(systemStatus)}</span>
        </div>
        <div className="flex items-center">
          <span className="mr-2">Controller: {currentUser.displayName}</span>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            {currentUser.initials}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
