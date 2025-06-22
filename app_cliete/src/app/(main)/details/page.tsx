"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, BedDouble, Image as ImageIcon, MapPin, CalendarClock, Star, Clock, Users, ArrowLeft, Heart, Share2 } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface PackageDetails {
  id: string;
  title: string;
  destination: string;
  country: string;
  price: {
    amount: number;
    currency: string;
  };
  duration: {
    days: number;
    nights: number;
  };
  category: string;
  description: {
    short: string;
    full: string;
  };
  images: {
    main: string;
    gallery?: string[];
  };
  rating: {
    average: number;
    count: number;
  };
  features: string[];
  highlights: string[];
  itinerary?: Array<{
    day: number;
    title: string;
    description: string;
    activities: string[];
  }>;
  included?: string[];
  notIncluded?: string[];
  _source?: string;
}

export default function DetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get('id');
  
  const [packageData, setPackageData] = useState<PackageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!packageId) {
      setError('ID de paquete no encontrado');
      setLoading(false);
      return;
    }

    loadPackageDetails(packageId);
  }, [packageId]);

  const loadPackageDetails = async (id: string) => {
    try {
      setLoading(true);
      console.log(`Loading package details for ID: ${id}`);
      
      const response = await fetch(`http://localhost:3002/api/packages/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPackageData(data.package);
        console.log('Package details loaded:', data.package);
      } else {
        throw new Error(data.error || 'Error al cargar detalles del paquete');
      }
    } catch (err) {
      console.error('Error loading package details:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteRequest = () => {
    if (packageData) {
      const quoteData = {
        packageId: packageData.id,
        title: packageData.title,
        destination: packageData.destination,
        price: packageData.price.amount,
        duration: packageData.duration
      };
      
      // Guardar datos en localStorage para la página de cotización
      localStorage.setItem('quotePackage', JSON.stringify(quoteData));
      router.push('/cotizar');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando detalles del paquete...</p>
        </div>
      </div>
    );
  }

  if (error || !packageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-destructive">Error</h2>
          <p className="text-muted-foreground">{error || 'Paquete no encontrado'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-8">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Título principal */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              {packageData.title}
            </h1>
            <div className="flex items-center space-x-4 text-muted-foreground">
              <div className="flex items-center">
                <MapPin className="mr-1 h-4 w-4" />
                {packageData.destination}, {packageData.country}
              </div>
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                {packageData.duration.days} días / {packageData.duration.nights} noches
              </div>
              <Badge variant="secondary">{packageData.category}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(packageData.rating.average)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {packageData.rating.average} ({packageData.rating.count} reseñas)
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              ${packageData.price.amount.toLocaleString()} {packageData.price.currency}
            </div>
            <p className="text-sm text-muted-foreground">por persona</p>
            <Button 
              size="lg" 
              className="mt-4 w-full"
              onClick={handleQuoteRequest}
            >
              Solicitar Cotización
            </Button>
          </div>
        </div>
      </div>

      {/* Imagen principal */}
      <div className="relative w-full h-96 rounded-xl overflow-hidden shadow-lg">
        <Image
          src={packageData.images.main}
          alt={packageData.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Grid de contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-8">
          {/* Descripción */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="mr-2 h-5 w-5 text-primary" />
                Descripción del Viaje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {packageData.description.full}
              </p>
            </CardContent>
          </Card>

          {/* Itinerario */}
          {packageData.itinerary && packageData.itinerary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarClock className="mr-2 h-5 w-5 text-primary" />
                  Itinerario Detallado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {packageData.itinerary.map((day) => (
                    <div key={day.day} className="border-l-2 border-primary pl-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                          {day.day}
                        </div>
                        <h4 className="font-semibold text-lg">{day.title}</h4>
                      </div>
                      <p className="text-muted-foreground mb-2">{day.description}</p>
                      {day.activities && day.activities.length > 0 && (
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {day.activities.map((activity, index) => (
                            <li key={index}>{activity}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Galería de imágenes */}
          {packageData.images.gallery && packageData.images.gallery.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ImageIcon className="mr-2 h-5 w-5 text-primary" />
                  Galería de Imágenes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {packageData.images.gallery.map((image, index) => (
                    <div key={index} className="relative h-32 rounded-lg overflow-hidden">
                      <Image
                        src={image}
                        alt={`${packageData.title} - Imagen ${index + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Destacados */}
          <Card>
            <CardHeader>
              <CardTitle>Destacados del Viaje</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {packageData.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
                    {highlight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Incluido */}
          {packageData.included && packageData.included.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Incluido</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {packageData.included.map((item, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* No incluido */}
          {packageData.notIncluded && packageData.notIncluded.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">No Incluido</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {packageData.notIncluded.map((item, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-3 flex-shrink-0"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Características */}
          <Card>
            <CardHeader>
              <CardTitle>Características</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {packageData.features.map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Botón de cotización fijo */}
          <Card className="sticky top-4">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    ${packageData.price.amount.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">por persona</p>
                </div>
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleQuoteRequest}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Solicitar Cotización
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}