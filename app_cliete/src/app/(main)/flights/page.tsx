
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PlaneTakeoff, PlaneLanding, CalendarDays, Clock, DoorOpen, AlertCircle } from "lucide-react";
import Image from 'next/image';

interface Flight {
  id: string;
  airline: string;
  airlineLogoUrl?: string;
  flightNumber: string;
  origin: { city: string; airportCode: string; terminal?: string; dateTime: string };
  destination: { city: string; airportCode: string; terminal?: string; dateTime: string };
  gate?: string;
  status: string;
  statusColor: string;
}

const mockFlights: Flight[] = [
  {
    id: "FL001",
    airline: "Aerolíneas Andinas", // Nombre de aerolínea actualizado
    airlineLogoUrl: "https://placehold.co/40x40.png",
    flightNumber: "AA2024", // Número de vuelo actualizado
    origin: { city: "Mendoza", airportCode: "MDZ", terminal: "1", dateTime: "2024-09-15T08:00:00Z" }, // Origen actualizado
    destination: { city: "París", airportCode: "CDG", terminal: "2A", dateTime: "2024-09-15T22:00:00Z" }, // Destino y hora de llegada ajustada
    gate: "C10",
    status: "A Tiempo",
    statusColor: "text-green-600", 
  },
  {
    id: "FL002",
    airline: "Air France", // Nombre de aerolínea actualizado
    airlineLogoUrl: "https://placehold.co/40x40.png", // Logo añadido para consistencia
    flightNumber: "AF815", // Número de vuelo actualizado
    origin: { city: "París", airportCode: "CDG", terminal: "2E", dateTime: "2024-09-18T14:30:00Z" }, // Origen actualizado
    destination: { city: "Mendoza", airportCode: "MDZ", terminal: "1", dateTime: "2024-09-19T05:30:00Z" }, // Destino y hora de llegada ajustada
    gate: "A22",
    status: "Retrasado",
    statusColor: "text-orange-500",
  },
];

function FlightInfoItem({ Icon, label, value }: { Icon: React.ElementType, label: string, value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center space-x-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

export default function FlightsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight text-foreground">Tus Vuelos</h2>
      
      {mockFlights.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes vuelos programados.</p>
          </CardContent>
        </Card>
      )}

      {mockFlights.map((flight) => (
        <Card key={flight.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                {flight.airlineLogoUrl && (
                  <Image src={flight.airlineLogoUrl} alt={`Logo de ${flight.airline}`} data-ai-hint="airline logo" width={40} height={40} className="rounded-full mb-2" />
                )}
                <CardTitle className="text-xl text-primary">{flight.airline} - {flight.flightNumber}</CardTitle>
                <CardDescription className={`${flight.statusColor} font-semibold`}>{flight.status}</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <AlertCircle className="mr-2 h-4 w-4" /> Crear Alerta
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 p-3 bg-secondary/30 rounded-md">
                <h4 className="font-semibold flex items-center"><PlaneTakeoff className="mr-2 h-5 w-5 text-primary" />Salida</h4>
                <FlightInfoItem Icon={CalendarDays} label="Fecha" value={new Date(flight.origin.dateTime).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} />
                <FlightInfoItem Icon={Clock} label="Hora" value={new Date(flight.origin.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} />
                <FlightInfoItem Icon={DoorOpen} label="Ciudad" value={flight.origin.city} />
                <FlightInfoItem Icon={DoorOpen} label="Aeropuerto" value={flight.origin.airportCode} />
                <FlightInfoItem Icon={DoorOpen} label="Terminal" value={flight.origin.terminal} />
              </div>
              <div className="space-y-2 p-3 bg-secondary/30 rounded-md">
                <h4 className="font-semibold flex items-center"><PlaneLanding className="mr-2 h-5 w-5 text-primary" />Llegada</h4>
                <FlightInfoItem Icon={CalendarDays} label="Fecha" value={new Date(flight.destination.dateTime).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} />
                <FlightInfoItem Icon={Clock} label="Hora" value={new Date(flight.destination.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} />
                <FlightInfoItem Icon={DoorOpen} label="Ciudad" value={flight.destination.city} />
                <FlightInfoItem Icon={DoorOpen} label="Aeropuerto" value={flight.destination.airportCode} />
                <FlightInfoItem Icon={DoorOpen} label="Terminal" value={flight.destination.terminal} />
              </div>
            </div>
            <Separator />
            <FlightInfoItem Icon={DoorOpen} label="Puerta" value={flight.gate} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
