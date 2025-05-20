import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import { useEffect } from "react";
import wsClient from "./lib/webSocket";
import BasicMapView from "@/components/BasicMapView";

function Router() {
  const [location] = useLocation();
  
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/aircraft/:id" component={Dashboard} />
      <Route path="/maptest" component={BasicMapView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Initialize WebSocket connection
    wsClient.connect();
    
    // Cleanup on unmount
    return () => {
      wsClient.disconnect();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
