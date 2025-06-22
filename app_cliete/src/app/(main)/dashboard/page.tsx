
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, CalendarCheck, PartyPopper, Plane, Coffee, MountainSnow, BellDot, Lightbulb, MapPin, UtensilsCrossed, Footprints, Languages, Bus, ChevronDown, ChevronUp, Briefcase } from "lucide-react"; // Added icons
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import type { LucideIcon } from 'lucide-react';

const mockDestination = "París, Francia";
const mockWeather = {
  city: mockDestination,
  temp: 22,
  description: "Soleado con algunas nubes",
  icon: Sun,
};

interface TravelTip {
  id: string;
  text: string;
  category: string;
  icon: LucideIcon;
}

const mockTravelTips: TravelTip[] = [
  { id: "tip1", text: `No olvides visitar la Catedral de Notre Dame en ${mockDestination.split(',')[0]}. ¡Está a solo 15 minutos a pie de tu hotel!`, icon: MapPin, category: "Atracción Cercana" },
  { id: "tip2", text: `Prueba los croissants y macarons en una auténtica pastelería parisina.`, icon: UtensilsCrossed, category: "Gastronomía Local" },
  { id: "tip3", text: `Lleva calzado cómodo. ¡Explorar ${mockDestination.split(',')[0]} implica caminar mucho!`, icon: Footprints, category: "Preparación" },
  { id: "tip4", text: `Aprende algunas frases básicas en francés, como "Bonjour" (Hola) y "Merci" (Gracias).`, icon: Languages, category: "Cultura Local" },
  { id: "tip5", text: `Compra un pase de transporte público si planeas moverte mucho por la ciudad.`, icon: Bus, category: "Transporte" },
];

const getFixedTripDate = () => {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 45);
  futureDate.setHours(14, 30, 0, 0);
  return futureDate;
};


export default function DashboardPage() {
  const [tripDate] = useState(getFixedTripDate());
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isClient, setIsClient] = useState(false);
  const [showAllTips, setShowAllTips] = useState(false); // State for expanding tips
  const { toast } = useToast();

  const TRIP_ALERT_KEY_PREFIX = 'tripAlertShown_';

  const checkAndShowAlert = (daysRemaining: number, alertThreshold: number, alertMessage: string, toastTitle: string) => {
    const alertId = `${TRIP_ALERT_KEY_PREFIX}${tripDate.toISOString()}_${alertThreshold}_days`;
    if (daysRemaining === alertThreshold && !localStorage.getItem(alertId)) {
      toast({
        title: (
          <div className="flex items-center">
            <BellDot className="h-5 w-5 mr-2 text-accent" />
            {toastTitle}
          </div>
        ),
        description: alertMessage,
        duration: 10000,
      });
      localStorage.setItem(alertId, 'true');
    }
  };


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const calculateTimeLeftAndAlerts = () => {
      const difference = +tripDate - +new Date();
      let newTimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }

      setTimeLeft(newTimeLeft);

      checkAndShowAlert(
        newTimeLeft.days,
        7,
        `¡Tu viaje a ${mockDestination.split(',')[0]} es en 1 semana! Asegúrate de tener todo listo.`,
        "📢 Recordatorio: Viaje Próximo"
      );
      checkAndShowAlert(
        newTimeLeft.days,
        2,
        `¡Solo faltan 2 días para tu aventura en ${mockDestination.split(',')[0]}! Revisa los últimos detalles.`,
        "🎉 ¡Casi Listo para Viajar!"
      );

      return newTimeLeft;
    };

    calculateTimeLeftAndAlerts();

    const timer = setInterval(() => {
      calculateTimeLeftAndAlerts();
    }, 1000);

    return () => clearInterval(timer);
  }, [tripDate, isClient, toast]);

  const EMOJIS = ["✈️", "🏝️", "☀️", "🥳", "🌍", "😎", "🌴", "🗺️", "🎒"];
  const [currentEmoji, setCurrentEmoji] = useState(EMOJIS[0]);

  useEffect(() => {
    if (!isClient) return;
    const emojiInterval = setInterval(() => {
      setCurrentEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
    }, 2000);
    return () => clearInterval(emojiInterval);
  }, [isClient]);


  if (!isClient) {
    return null;
  }

  const tipsToDisplay = showAllTips ? mockTravelTips : mockTravelTips.slice(0, 2);

  const inspirationActions = [
    { title: "Tour Gastronómico", icon: Coffee, hint: "food market", image: "/gastro.jfif" },
    { title: "Museos Históricos", icon: Briefcase, hint: "museum art", image: "/Museo.jfif" },
    { title: "Naturaleza Cercana", icon: MountainSnow, hint: "nature trail", image: "/sender.jfif" }
  ];


  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-primary tracking-tight">¡Bienvenido a tu Aventura!</h1>
        <p className="text-xl text-muted-foreground mt-2">Prepara todo para tu próximo viaje a <span className="font-semibold text-accent">{mockDestination}</span></p>
      </div>

      <Card className="shadow-xl text-primary-foreground overflow-hidden relative">
        <CardHeader className="text-center relative z-10">
          <div className="flex items-center justify-center text-3xl font-bold mb-2">
            <PartyPopper className="h-10 w-10 mr-3 text-accent animate-pulse-subtle" />
            <CardTitle>¡Tu Viaje Comienza Pronto!</CardTitle>
            <PartyPopper className="h-10 w-10 ml-3 text-accent animate-pulse-subtle" />
          </div>
          <CardDescription className="text-lg text-primary-foreground/80">
            Faltan para tu aventura en {mockDestination.split(',')[0]}:
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
            {(Object.keys(timeLeft) as Array<keyof typeof timeLeft>).map((interval) => (
              <div key={interval} className="bg-black/20 p-4 rounded-lg shadow-md backdrop-blur-sm">
                <div className="text-4xl font-extrabold text-accent"> {/* Reduced size from text-5xl */}
                  {timeLeft[interval]}
                </div>
                <div className="text-xs uppercase tracking-wider text-primary-foreground/90 mt-1"> {/* Reduced size from text-sm and margin */}
                  {interval === 'days' ? 'Días' : interval === 'hours' ? 'Horas' : interval === 'minutes' ? 'Minutos' : 'Segundos'}
                </div>
              </div>
            ))}
          </div>
          <div className="text-6xl my-6 animate-bounce">
            {currentEmoji}
          </div>
          <Link href="/details" passHref>
            <Button variant="outline" className="bg-accent text-accent-foreground hover:bg-accent/90 border-accent shadow-lg text-lg px-8 py-6">
              <CalendarCheck className="mr-2 h-5 w-5" /> Ver Detalles del Viaje
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8 mt-12">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-primary">Clima en {mockWeather.city.split(',')[0]}</CardTitle>
            <mockWeather.icon className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{mockWeather.temp}°C</div>
            <p className="text-sm text-muted-foreground mt-1">{mockWeather.description}</p>
            <Button variant="outline" className="mt-4 text-accent border-accent hover:bg-accent hover:text-accent-foreground">
                Ver Pronóstico Completo
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-primary">Consejos para tu Viaje a {mockDestination.split(',')[0]}</CardTitle>
            <Lightbulb className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            {tipsToDisplay.length > 0 ? (
              <ul className="space-y-3">
                {tipsToDisplay.map(tip => (
                  <li key={tip.id} className="flex items-start space-x-3 border-b border-border pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
                    <tip.icon className="h-5 w-5 text-accent mt-1 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">{tip.text}</p>
                      <p className="text-xs text-muted-foreground">{tip.category}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No hay consejos disponibles por el momento.</p>
            )}
            {mockTravelTips.length > 2 && (
                <Button
                    variant="link"
                    className="text-accent px-0 mt-3 flex items-center"
                    onClick={() => setShowAllTips(!showAllTips)}
                >
                    {showAllTips ? "Ver menos consejos" : "Ver más consejos..."}
                    {showAllTips ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg mt-12">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Inspiración para tu Viaje</CardTitle>
          <CardDescription>Actividades y lugares imperdibles en {mockDestination.split(',')[0]}.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {inspirationActions.map(action => (
            <Card key={action.title} className="p-4 hover:bg-secondary/50 transition-colors">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-full h-32 mb-3 rounded-md overflow-hidden">
                    <Image src={action.image} alt={action.title} layout="fill" objectFit="cover" data-ai-hint={action.hint}/>
                </div>
                <action.icon className="h-8 w-8 text-accent mb-2" />
                <p className="font-semibold text-foreground">{action.title}</p>
                <Button variant="ghost" size="sm" className="mt-1 text-accent hover:text-accent/80">Explorar</Button>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
