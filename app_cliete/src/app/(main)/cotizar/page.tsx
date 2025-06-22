"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Calendar, MapPin, Send, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface QuotePackage {
  packageId: string;
  title: string;
  destination: string;
  price: number;
  duration: {
    days: number;
    nights: number;
  };
}

interface QuoteForm {
  // Información del paquete
  packageId: string;
  packageTitle: string;
  
  // Información personal
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Detalles del viaje
  adults: number;
  children: number;
  departureDate: string;
  budget: string;
  
  // Preferencias
  roomType: string;
  specialRequests: string;
  
  // Marketing
  hearAboutUs: string;
}

export default function CotizarPage() {
  const router = useRouter();
  const [packageData, setPackageData] = useState<QuotePackage | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<QuoteForm>({
    packageId: '',
    packageTitle: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    adults: 2,
    children: 0,
    departureDate: '',
    budget: '',
    roomType: '',
    specialRequests: '',
    hearAboutUs: ''
  });

  useEffect(() => {
    // Recuperar datos del paquete desde localStorage
    const savedPackage = localStorage.getItem('quotePackage');
    if (savedPackage) {
      const packageInfo = JSON.parse(savedPackage);
      setPackageData(packageInfo);
      setFormData(prev => ({
        ...prev,
        packageId: packageInfo.packageId,
        packageTitle: packageInfo.title
      }));
    }
  }, []);

  const handleInputChange = (field: keyof QuoteForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Simular envío a la API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Cotización enviada:', formData);
      setSubmitted(true);
      
      // Limpiar localStorage
      localStorage.removeItem('quotePackage');
      
    } catch (error) {
      console.error('Error enviando cotización:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="space-y-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-600">
              ¡Cotización Enviada Exitosamente!
            </h1>
            <p className="text-muted-foreground text-lg">
              Hemos recibido tu solicitud de cotización para {packageData?.title}
            </p>
          </div>
          
          <Card className="text-left">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <h3 className="font-semibold">¿Qué sigue?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Nuestro equipo revisará tu solicitud en las próximas 2-4 horas</li>
                  <li>• Te contactaremos vía email y teléfono con una cotización personalizada</li>
                  <li>• Podrás hacer ajustes al itinerario según tus preferencias</li>
                  <li>• Una vez aprobado, te ayudaremos con todo el proceso de reserva</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-4 justify-center">
            <Button onClick={() => router.push('/dashboard')}>
              Volver al Inicio
            </Button>
            <Button variant="outline" onClick={() => router.push('/packages')}>
              Ver Más Paquetes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Solicitar Cotización</h1>
          <p className="text-muted-foreground">
            Completa el formulario y te contactaremos con una propuesta personalizada
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Personal */}
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                  Necesitamos estos datos para contactarte con la cotización
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    placeholder="tu@email.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                    placeholder="+54 9 11 1234-5678"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Detalles del Viaje */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles del Viaje</CardTitle>
                <CardDescription>
                  Ayúdanos a personalizar tu experiencia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adults">Adultos</Label>
                    <Select
                      value={formData.adults.toString()}
                      onValueChange={(value) => handleInputChange('adults', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'adulto' : 'adultos'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="children">Niños</Label>
                    <Select
                      value={formData.children.toString()}
                      onValueChange={(value) => handleInputChange('children', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0,1,2,3,4].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'niño' : 'niños'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="departureDate">Fecha de Salida Preferida</Label>
                  <Input
                    id="departureDate"
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => handleInputChange('departureDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <Label htmlFor="budget">Presupuesto Aproximado</Label>
                  <Select
                    value={formData.budget}
                    onValueChange={(value) => handleInputChange('budget', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rango" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000-2000">$1,000 - $2,000 USD</SelectItem>
                      <SelectItem value="2000-3000">$2,000 - $3,000 USD</SelectItem>
                      <SelectItem value="3000-5000">$3,000 - $5,000 USD</SelectItem>
                      <SelectItem value="5000+">$5,000+ USD</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="roomType">Tipo de Habitación</Label>
                  <Select
                    value={formData.roomType}
                    onValueChange={(value) => handleInputChange('roomType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo de habitación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Individual</SelectItem>
                      <SelectItem value="double">Doble</SelectItem>
                      <SelectItem value="twin">Twin</SelectItem>
                      <SelectItem value="suite">Suite</SelectItem>
                      <SelectItem value="family">Familiar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Preferencias Adicionales */}
            <Card>
              <CardHeader>
                <CardTitle>Preferencias Adicionales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="specialRequests">Solicitudes Especiales</Label>
                  <Textarea
                    id="specialRequests"
                    value={formData.specialRequests}
                    onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    placeholder="Dietas especiales, celebraciones, necesidades de accesibilidad, etc."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="hearAboutUs">¿Cómo conociste InterTravel?</Label>
                  <Select
                    value={formData.hearAboutUs}
                    onValueChange={(value) => handleInputChange('hearAboutUs', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google / Búsqueda web</SelectItem>
                      <SelectItem value="social">Redes sociales</SelectItem>
                      <SelectItem value="recommendation">Recomendación</SelectItem>
                      <SelectItem value="advertising">Publicidad</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full" 
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Solicitud de Cotización
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Resumen del paquete */}
        <div>
          {packageData && (
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumen del Paquete</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{packageData.title}</h3>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="mr-1 h-4 w-4" />
                    {packageData.destination}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Duración:</span>
                    <span>{packageData.duration.days} días / {packageData.duration.nights} noches</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Precio base:</span>
                    <span className="font-semibold">${packageData.price.toLocaleString()} USD</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Viajeros:</span>
                    <span>{formData.adults + formData.children} personas</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total estimado:</span>
                    <span className="text-lg text-primary">
                      ${(packageData.price * (formData.adults + formData.children)).toLocaleString()} USD
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    * Precio estimado sujeto a cotización final
                  </p>
                </div>

                <div className="space-y-2">
                  <Badge variant="outline" className="w-full justify-center">
                    <Users className="mr-1 h-3 w-3" />
                    Cotización personalizada
                  </Badge>
                  <Badge variant="outline" className="w-full justify-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    Fechas flexibles
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}