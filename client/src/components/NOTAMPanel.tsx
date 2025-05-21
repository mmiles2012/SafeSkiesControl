import { useState } from 'react';
import { NOTAM } from '@/types/aircraft';
import { format } from 'date-fns';

interface NOTAMPanelProps {
  notams: NOTAM[];
  isLoading: boolean;
  selectedARTCC: string;
}

const NOTAMPanel: React.FC<NOTAMPanelProps> = ({
  notams,
  isLoading,
  selectedARTCC
}) => {
  const [expandedNotamId, setExpandedNotamId] = useState<number | null>(null);
  
  // Filter NOTAMs relevant to the selected ARTCC
  const filteredNotams = notams.filter(
    notam => notam.isActive && (notam.location === selectedARTCC || notam.location === 'ALL')
  );
  
  return (
    <div className="bg-card p-3 rounded-lg shadow-md border border-border">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-base">NOTAMs ({filteredNotams.length})</h3>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : filteredNotams.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-3">
          No active NOTAMs for {selectedARTCC}
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
          {filteredNotams.map(notam => (
            <div 
              key={notam.id}
              className={`p-2 rounded-md text-sm transition-colors ${
                notam.severity === 'high' 
                  ? 'bg-destructive/15 border border-destructive/30' 
                  : notam.severity === 'medium'
                    ? 'bg-yellow-500/15 border border-yellow-500/30'
                    : 'bg-muted/50 border border-border'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <span className={`h-2 w-2 rounded-full ${
                    notam.severity === 'high' 
                      ? 'bg-destructive' 
                      : notam.severity === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-primary'
                  }`}></span>
                  <span className="font-medium">{notam.title}</span>
                </div>
                <button 
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setExpandedNotamId(expandedNotamId === notam.id ? null : notam.id)}
                >
                  {expandedNotamId === notam.id ? 'Collapse' : 'Details'}
                </button>
              </div>
              
              {expandedNotamId === notam.id && (
                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-muted-foreground">{notam.message}</p>
                  <div className="flex justify-between mt-1 pt-1 border-t border-border">
                    <span>Location: {notam.location}</span>
                    <span>Valid until: {notam.endDate ? format(new Date(notam.endDate), 'MMM d, yyyy') : 'Indefinite'}</span>
                  </div>
                  {notam.affectedAltitude && (
                    <div className="text-muted-foreground">
                      Altitude: {notam.affectedAltitude.min} ft - {notam.affectedAltitude.max} ft
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NOTAMPanel;