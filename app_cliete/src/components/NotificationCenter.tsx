"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  Bell, 
  BellOff, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  Settings, 
  Plane, 
  CreditCard, 
  AlertTriangle, 
  Info,
  Calendar,
  MapPin
} from "lucide-react";
import { useNotifications, Notification } from "@/contexts/notification-context";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    isEnabled,
    toggleNotifications
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking': return <Calendar className="w-4 h-4" />;
      case 'travel': return <Plane className="w-4 h-4" />;
      case 'payment': return <CreditCard className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <X className="w-4 h-4" />;
      case 'success': return <Check className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
    if (priority === 'urgent') return 'bg-red-100 border-red-300 text-red-800';
    if (priority === 'high') return 'bg-orange-100 border-orange-300 text-orange-800';
    
    switch (type) {
      case 'booking': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'travel': return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'payment': return 'bg-green-100 border-green-300 text-green-800';
      case 'warning': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'error': return 'bg-red-100 border-red-300 text-red-800';
      case 'success': return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent': return <Badge variant="destructive" className="text-xs">Urgente</Badge>;
      case 'high': return <Badge variant="default" className="text-xs bg-orange-600">Alta</Badge>;
      case 'medium': return <Badge variant="secondary" className="text-xs">Media</Badge>;
      default: return null;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: es });
    } catch {
      return 'Hace un momento';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {isEnabled ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-96 sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} nuevas</Badge>
              )}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleNotifications}
                title={isEnabled ? "Desactivar notificaciones" : "Activar notificaciones"}
              >
                {isEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                title="Marcar todas como leídas"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
                disabled={notifications.length === 0}
                title="Limpiar todas"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </SheetTitle>
          <SheetDescription>
            Mantente al día con las actualizaciones de tus viajes
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        {!isEnabled && (
          <Card className="mb-4 border-amber-300 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <BellOff className="h-4 w-4" />
                <span className="text-sm">Las notificaciones están desactivadas</span>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={toggleNotifications}
                  className="text-amber-800 p-0 h-auto"
                >
                  Activar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <ScrollArea className="h-[calc(100vh-200px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin notificaciones</h3>
              <p className="text-muted-foreground text-sm">
                Cuando tengas actualizaciones sobre tus viajes, aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    !notification.read ? 'ring-2 ring-blue-200 bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${getNotificationColor(notification.type, notification.priority)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium text-sm truncate pr-2">
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {getPriorityBadge(notification.priority)}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.timestamp)}
                          </span>
                          
                          {notification.actionUrl && notification.actionText && (
                            <Link href={notification.actionUrl} onClick={(e) => e.stopPropagation()}>
                              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                {notification.actionText}
                              </Button>
                            </Link>
                          )}
                        </div>
                        
                        {!notification.read && (
                          <div className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
