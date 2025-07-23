import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Users, CreditCard, Clock, Eye } from "lucide-react";
import { Booking } from "@/services/api-client";
import { bookingsService } from "@/services/bookings-service";
import Link from "next/link";

interface BookingCardProps {
  booking: Booking;
}

export function BookingCard({ booking }: BookingCardProps) {
  const daysUntilTravel = bookingsService.getDaysUntilTravel(booking.travelDate);
  const isUpcoming = daysUntilTravel > 0;
  const isPastTravel = daysUntilTravel < 0;
  
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{booking.packageTitle}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-1" />
              {booking.destination}, {booking.country}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={bookingsService.getStatusColor(booking.status)}>
              {bookingsService.getStatusText(booking.status)}
            </Badge>
            <Badge 
              variant="outline" 
              className={bookingsService.getPaymentStatusColor(booking.paymentStatus)}
            >
              {bookingsService.getPaymentStatusText(booking.paymentStatus)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Información de fechas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <div>
              <div className="text-xs text-muted-foreground">Salida</div>
              <div className="text-sm font-medium">
                {bookingsService.formatShortDate(booking.travelDate)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-4 h-4 text-green-600" />
            <div>
              <div className="text-xs text-muted-foreground">Regreso</div>
              <div className="text-sm font-medium">
                {bookingsService.formatShortDate(booking.returnDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Duración y viajeros */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>{booking.durationDays} días</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-orange-600" />
            <span>{booking.travelersCount} viajero{booking.travelersCount > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Información financiera */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-green-600" />
            <div>
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="font-bold text-lg">
                {bookingsService.formatCurrency(booking.totalAmount, booking.currency)}
              </div>
            </div>
          </div>
          {booking.paidAmount > 0 && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Pagado</div>
              <div className="font-medium text-green-600">
                {bookingsService.formatCurrency(booking.paidAmount, booking.currency)}
              </div>
            </div>
          )}
        </div>

        {/* Contador de días */}
        {isUpcoming && booking.status === 'confirmed' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{daysUntilTravel}</div>
            <div className="text-xs text-blue-600">
              día{daysUntilTravel !== 1 ? 's' : ''} para tu viaje
            </div>
          </div>
        )}

        {isPastTravel && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600">
              Viaje completado hace {Math.abs(daysUntilTravel)} día{Math.abs(daysUntilTravel) !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Servicios incluidos */}
        {booking.services && booking.services.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Servicios incluidos:</div>
            <div className="flex flex-wrap gap-1">
              {booking.services.slice(0, 3).map((service, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {service}
                </Badge>
              ))}
              {booking.services.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{booking.services.length - 3} más
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Botón de acción */}
        <Link href={`/reservas/${booking.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            <Eye className="w-4 h-4 mr-2" />
            Ver Detalles
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
