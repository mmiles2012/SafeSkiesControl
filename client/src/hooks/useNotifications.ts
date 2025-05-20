// Hook for managing notifications

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Notification, NotificationFilters } from "../types/aircraft";
import { fetchNotifications, updateNotification } from "../lib/dataIntegration";
import wsClient from "../lib/webSocket";

export function useNotifications() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<NotificationFilters>({
    type: "all",
    status: "pending",
    priority: "all"
  });
  
  // Fetch all notifications
  const { data: notifications = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 15000, // Refetch every 15 seconds
  });
  
  // Initialize WebSocket listeners
  useEffect(() => {
    // Subscribe to new notifications
    const unsubscribe = wsClient.onNotification((newNotification) => {
      queryClient.setQueryData(["/api/notifications"], (oldData: Notification[] = []) => {
        // Check if notification already exists
        const exists = oldData.some(n => n.id === newNotification.id);
        
        if (exists) {
          // Update existing notification
          return oldData.map(n => 
            n.id === newNotification.id ? newNotification : n
          );
        } else {
          // Add new notification
          return [...oldData, newNotification];
        }
      });
      
      // Play notification sound
      playNotificationSound(newNotification.priority);
    });
    
    return () => {
      unsubscribe();
    };
  }, [queryClient]);
  
  // Play notification sound based on priority
  const playNotificationSound = useCallback((priority: string) => {
    try {
      let sound;
      
      switch (priority) {
        case "high":
          // High priority sound
          sound = new Audio("https://cdn.freesound.org/previews/181/181319_3268102-lq.mp3");
          break;
        case "normal":
          // Normal priority sound
          sound = new Audio("https://cdn.freesound.org/previews/263/263133_4486188-lq.mp3");
          break;
        default:
          // Low priority sound
          sound = new Audio("https://cdn.freesound.org/previews/273/273203_4486188-lq.mp3");
          break;
      }
      
      sound.volume = 0.5;
      sound.play();
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  }, []);
  
  // Mark a notification as resolved
  const resolveNotification = useCallback(async (id: number) => {
    try {
      const updatedNotification = await updateNotification(id, { status: "resolved" });
      
      // Update the notification in the cache
      queryClient.setQueryData(["/api/notifications"], (oldData: Notification[] = []) => {
        return oldData.map(n => 
          n.id === id ? updatedNotification : n
        );
      });
      
      return updatedNotification;
    } catch (error) {
      console.error("Error resolving notification:", error);
      throw error;
    }
  }, [queryClient]);
  
  // Apply filters to notifications
  const filteredNotifications = useCallback(() => {
    if (!notifications) return [];
    
    return notifications.filter(notification => {
      // Type filter
      if (filters.type && filters.type !== "all") {
        if (notification.type !== filters.type) {
          return false;
        }
      }
      
      // Status filter
      if (filters.status && filters.status !== "all") {
        if (notification.status !== filters.status) {
          return false;
        }
      }
      
      // Priority filter
      if (filters.priority && filters.priority !== "all") {
        if (notification.priority !== filters.priority) {
          return false;
        }
      }
      
      return true;
    });
  }, [notifications, filters]);
  
  // Update filters
  const updateFilters = useCallback((newFilters: Partial<NotificationFilters>) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);
  
  // Get notification count by type
  const getNotificationCountByType = useCallback((type: string) => {
    if (!notifications) return 0;
    
    if (type === "all") {
      return notifications.filter(n => n.status === "pending").length;
    }
    
    return notifications.filter(n => n.type === type && n.status === "pending").length;
  }, [notifications]);
  
  // Get notification icon by type
  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case "collision":
        return "warning";
      case "handoff":
        return "flight_takeoff";
      case "airspace":
        return "flight_land";
      case "assistance":
        return "priority_high";
      case "system":
        return "info";
      default:
        return "notifications";
    }
  }, []);
  
  // Get notification color by priority
  const getNotificationColor = useCallback((priority: string) => {
    switch (priority) {
      case "high":
        return "#F44336"; // Danger red
      case "normal":
        return "#FFC107"; // Warning yellow
      case "low":
        return "#4CAF50"; // Success green
      default:
        return "#B0B0B0"; // Gray
    }
  }, []);
  
  return {
    notifications,
    filteredNotifications: filteredNotifications(),
    isLoading,
    error,
    filters,
    updateFilters,
    resolveNotification,
    getNotificationCountByType,
    getNotificationIcon,
    getNotificationColor,
    refetch
  };
}
