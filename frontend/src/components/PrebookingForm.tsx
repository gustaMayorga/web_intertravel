'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  Mail, 
  User, 
  Users, 
  Calendar, 
  MessageCircle, 
  CheckCircle, 
  AlertCircle,
  Clock,
  DollarSign,
  MapPin,
  Plane,
  Heart,
  Star,
  Send,
  Copy
} from 'lucide-react';

interface PrebookingFormProps {
  packageData: {
    id: string;
    title: string;
    destination: string;
    price: {
      amount: number;
      currency: string;
    };
    duration: {
      days: number;
      nights: number;
    };
    images: {
      main: string;
    };
    source?: 'intertravel' | 'travel-compositor';
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  travelers: number;
  departureDate: string;
  specialRequests: string;
}

export default function PrebookingForm({ packageData, onSuccess, onCancel }: PrebookingFormProps) {
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    travelers: 2,
    departureDate: '',
    specialRequests: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'whatsapp' | 'success'>('form');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('+5492615555559');

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'El nombre es requerido';
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'El email no es válido';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'El teléfono es requerido';
    }

    if (formData.travelers < 1 || formData.travelers > 20) {
      newErrors.travelers = 'Número de viajeros inválido';
    }

    if (!formData.departureDate) {
      newErrors.departureDate = 'La fecha de salida es requerida';
    } else {
      const selectedDate = new Date(formData.departureDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.departureDate = 'La fecha debe ser futura';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateWhatsAppMessage = (): string => {
    const totalPrice = packageData.price.amount * formData.travelers;
    const formattedDate = new Date(formData.departureDate).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `🌍 *PREBOOKING INTERTRAVEL* 🌍

¡Hola! Completé el formulario de prebooking y estoy interesado/a en reservar:

📍 *DESTINO:* ${packageData.title}
🗺️ *Ubicación:* ${packageData.destination}
📅 *Duración:* ${packageData.duration.days} días / ${packageData.duration.nights} noches

👤 *DATOS PERSONALES:*
• Nombre: ${formData.customerName}
• Email: ${formData.customerEmail}
• Teléfono: ${formData.customerPhone}

✈️ *DETALLES DEL VIAJE:*
• Viajeros: ${formData.travelers} persona${formData.travelers > 1 ? 's' : ''}
• Fecha preferida: ${formattedDate}
• Precio unitario: ${packageData.price.currency} $${packageData.price.amount.toLocaleString()}
• *TOTAL ESTIMADO: ${packageData.price.currency} $${totalPrice.toLocaleString()}*

${formData.specialRequests ? `📝 *SOLICITUDES ESPECIALES:*\n${formData.specialRequests}\n\n` : ''}

${packageData.source === 'intertravel' ? '⭐ *PAQUETE INTERTRAVEL* - Calidad garantizada' : '🔄 *Disponible vía Travel Compositor*'}

Por favor, confirmen disponibilidad y procedan con la reserva. ¡Muchas gracias! 🙏

---
ID Prebooking: PB-${Date.now()}
Generado: ${new Date().toLocaleString('es-ES')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simular envío de prebooking al backend
      const response = await fetch('/api/packages/prebooking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: packageData.id,
          packageTitle: packageData.title,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          travelers: formData.travelers,
          preferredDate: formData.departureDate,
          specialRequests: formData.specialRequests,
          totalAmount: packageData.price.amount * formData.travelers,
          source: packageData.source || 'travel-compositor'
        }),
      });

      if (response.ok) {
        // Generar mensaje de WhatsApp
        const message = generateWhatsAppMessage();
        setWhatsappMessage(message);
        setStep('whatsapp');
      } else {
        throw new Error('Error en el servidor');
      }
    } catch (error) {
      console.error('Error creando prebooking:', error);
      setErrors({ submit: 'Error al procesar la solicitud. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppSend = () => {
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodedMessage}`;
    
    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Marcar como éxito
    setStep('success');
    
    // Callback de éxito
    setTimeout(() => {
      onSuccess?.();
    }, 2000);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      // Mostrar feedback visual
      const button = document.getElementById('copy-button');
      if (button) {
        button.textContent = '¡Copiado!';
        setTimeout(() => {
          button.textContent = 'Copiar Mensaje';
        }, 2000);
      }
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
    }
  };

  const totalPrice = packageData.price.amount * formData.travelers;

  if (step === 'success') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ¡Prebooking Exitoso!
            </h3>
            <p className="text-gray-600 mb-4">
              Tu solicitud ha sido enviada. Te contactaremos pronto para confirmar todos los detalles.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>📧 Recibirás un email de confirmación</p>
              <p>📱 También te contactaremos por WhatsApp</p>
              <p>⏱️ Tiempo de respuesta: 2-4 horas hábiles</p>
            </div>
            <Button 
              onClick={onSuccess}
              className="mt-6 w-full"
            >
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'whatsapp') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="w-6 h-6 mr-2 text-green-600" />
            Finalizar por WhatsApp
          </CardTitle>
          <CardDescription>
            Hemos preparado tu mensaje para WhatsApp. Haz clic para enviarlo directamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preview del mensaje */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Mensaje para WhatsApp:
              </span>
              <Button
                id="copy-button"
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copiar Mensaje
              </Button>
            </div>
            <div className="bg-white rounded-lg p-3 border max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {whatsappMessage}
              </pre>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center mb-2">
              <Phone className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-medium text-green-800">
                Centro de Reservas InterTravel
              </span>
            </div>
            <p className="text-green-700 text-sm mb-3">
              {whatsappNumber} | Horario: Lun-Vie 9:00-18:00, Sáb 9:00-13:00
            </p>
            <div className="text-xs text-green-600">
              ✓ Respuesta garantizada en 2-4 horas hábiles
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleWhatsAppSend}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Enviar por WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep('form')}
              className="flex-1"
            >
              Modificar Datos
            </Button>
          </div>

          {/* Información adicional */}
          <div className="text-center text-xs text-gray-500">
            <p>
              Al enviar este mensaje aceptas nuestros términos y condiciones.
              <br />
              Tu información está protegida y no será compartida con terceros.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario Principal */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plane className="w-6 h-6 mr-2 text-blue-600" />
                Información de Prebooking
              </CardTitle>
              <CardDescription>
                Completa tus datos para proceder con la reserva
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Datos personales */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Datos Personales
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">Nombre completo *</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="Juan Pérez"
                        className={errors.customerName ? 'border-red-500' : ''}
                        required
                      />
                      {errors.customerName && (
                        <p className="text-sm text-red-600 mt-1">{errors.customerName}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="customerPhone">Teléfono *</Label>
                      <Input
                        id="customerPhone"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="+54 261 XXX-XXXX"
                        className={errors.customerPhone ? 'border-red-500' : ''}
                        required
                      />
                      {errors.customerPhone && (
                        <p className="text-sm text-red-600 mt-1">{errors.customerPhone}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customerEmail">Email *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      placeholder="juan.perez@email.com"
                      className={errors.customerEmail ? 'border-red-500' : ''}
                      required
                    />
                    {errors.customerEmail && (
                      <p className="text-sm text-red-600 mt-1">{errors.customerEmail}</p>
                    )}
                  </div>
                </div>

                {/* Detalles del viaje */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Detalles del Viaje
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="travelers">Número de viajeros *</Label>
                      <select
                        id="travelers"
                        value={formData.travelers}
                        onChange={(e) => setFormData(prev => ({ ...prev, travelers: parseInt(e.target.value) }))}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(num => (
                          <option key={num} value={num}>
                            {num} viajero{num > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                      {errors.travelers && (
                        <p className="text-sm text-red-600 mt-1">{errors.travelers}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="departureDate">Fecha preferida de salida *</Label>
                      <Input
                        id="departureDate"
                        type="date"
                        value={formData.departureDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className={errors.departureDate ? 'border-red-500' : ''}
                        required
                      />
                      {errors.departureDate && (
                        <p className="text-sm text-red-600 mt-1">{errors.departureDate}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Solicitudes especiales */}
                <div>
                  <Label htmlFor="specialRequests">Solicitudes especiales (opcional)</Label>
                  <Textarea
                    id="specialRequests"
                    value={formData.specialRequests}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                    placeholder="Dieta especial, ocasión especial, habitaciones específicas, etc."
                    rows={3}
                  />
                </div>

                {/* Error general */}
                {errors.submit && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {errors.submit}
                    </p>
                  </div>
                )}

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Continuar con WhatsApp
                      </>
                    )}
                  </Button>
                  
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Resumen del Paquete */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Resumen de Reserva</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Imagen del paquete */}
              <div className="aspect-video relative rounded-lg overflow-hidden">
                <img
                  src={packageData.images.main}
                  alt={packageData.title}
                  className="w-full h-full object-cover"
                />
                {packageData.source === 'intertravel' && (
                  <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    InterTravel
                  </Badge>
                )}
              </div>

              {/* Información del paquete */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2">{packageData.title}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {packageData.destination}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {packageData.duration.days} días / {packageData.duration.nights} noches
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    {formData.travelers} viajero{formData.travelers > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Precio */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Precio por persona:</span>
                    <span>${packageData.price.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Viajeros:</span>
                    <span>{formData.travelers}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total estimado:</span>
                    <span className="text-blue-600">${totalPrice.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * Precio final sujeto a disponibilidad y condiciones
                </p>
              </div>

              {/* Garantías */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Atención 24/7 durante el viaje
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Garantía de satisfacción
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 w-4 mr-2" />
                  Seguro de viaje incluido
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
