import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Wifi, WifiOff, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface SyncIndicatorProps {
  isActive: boolean;
  hasChanges: boolean;
  lastSync: string | null;
  error: string | null;
}

export function SyncIndicator({ isActive, hasChanges, lastSync, error }: SyncIndicatorProps) {
  const getIcon = () => {
    if (error) return <AlertCircle className="w-3 h-3" />;
    if (!isActive) return <WifiOff className="w-3 h-3" />;
    if (hasChanges) return <Clock className="w-3 h-3" />;
    return <CheckCircle className="w-3 h-3" />;
  };

  const getVariant = () => {
    if (error) return "destructive";
    if (!isActive) return "secondary";
    if (hasChanges) return "default";
    return "default";
  };

  const getText = () => {
    if (error) return "Error sincronización";
    if (!isActive) return "Sin sincronizar";
    if (hasChanges) return "Actualizaciones pendientes";
    return "Sincronizado";
  };

  const getTooltipText = () => {
    if (error) return `Error: ${error}`;
    if (!isActive) return "La sincronización automática está desactivada";
    if (hasChanges) return "Hay cambios nuevos disponibles";
    if (lastSync) {
      const syncDate = new Date(lastSync);
      return `Última sincronización: ${syncDate.toLocaleTimeString()}`;
    }
    return "Sistema sincronizado";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={getVariant()} 
            className="text-xs cursor-help inline-flex items-center gap-1"
          >
            {getIcon()}
            {getText()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
