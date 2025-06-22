'use client';

import React, { useState } from 'react';
import { FileText, Scale, Shield, AlertTriangle, CheckCircle, Clock, MapPin, CreditCard } from 'lucide-react';

const TermsConditions: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const sections = [
    {
      id: 'acceptance',
      title: 'Aceptación de los Términos',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'green',
      content: `Al acceder y utilizar el sitio web de InterTravel, aceptas estar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestros servicios.`
    },
    {
      id: 'services',
      title: 'Descripción de Servicios',
      icon: <MapPin className="w-6 h-6" />,
      color: 'blue',
      content: `InterTravel es una agencia de viajes que ofrece servicios de reserva de vuelos, hoteles, paquetes turísticos y experiencias de viaje. Actuamos como intermediarios entre tú y los proveedores de servicios turísticos.`
    },
    {
      id: 'booking',
      title: 'Proceso de Reserva',
      icon: <Clock className="w-6 h-6" />,
      color: 'orange',
      content: `Las reservas están sujetas a disponibilidad y confirmación por parte de los proveedores. Los precios pueden cambiar hasta que se complete el pago. Una vez confirmada, recibirás un email con los detalles de tu reserva.`
    },
    {
      id: 'payment',
      title: 'Pagos y Facturación',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'purple',
      content: `Aceptamos las principales tarjetas de crédito y débito. Los pagos se procesan de forma segura a través de nuestros socios certificados. Los precios incluyen impuestos aplicables salvo que se indique lo contrario.`
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'bg-green-50 border-green-200 text-green-800',
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <Scale className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Términos y Condiciones</h1>
          </div>
          <p className="text-center text-xl text-gray-300 max-w-3xl mx-auto">
            Conoce los términos que rigen el uso de nuestros servicios de viajes
          </p>
          <div className="text-center mt-4">
            <span className="bg-gray-600 px-4 py-2 rounded-full text-sm">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Información de la empresa */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-l-4 border-gray-600">
            <div className="flex items-start space-x-4">
              <FileText className="w-6 h-6 text-gray-600 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Información de la Empresa</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Datos de la Empresa</h3>
                    <div className="text-gray-700 space-y-1">
                      <p><strong>Razón Social:</strong> InterTravel S.A.</p>
                      <p><strong>CUIT:</strong> 30-12345678-9</p>
                      <p><strong>Legajo:</strong> EVyT-12345</p>
                      <p><strong>Disposición:</strong> 1234/2024</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Contacto</h3>
                    <div className="text-gray-700 space-y-1">
                      <p><strong>Dirección:</strong> Av. San Martín 1234, Mendoza</p>
                      <p><strong>Teléfono:</strong> +54 261 123-4567</p>
                      <p><strong>Email:</strong> info@intertravel.com</p>
                      <p><strong>Horarios:</strong> Lun-Vie 9:00-18:00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secciones principales */}
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div 
                  className={`p-6 cursor-pointer transition-all ${getColorClasses(section.color)} border-l-4`}
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-current">{section.icon}</div>
                      <h3 className="text-xl font-bold">{section.title}</h3>
                    </div>
                    <div className={`transform transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`}>
                      ▼
                    </div>
                  </div>
                  {expandedSection !== section.id && (
                    <p className="mt-2 text-sm opacity-80">
                      {section.content.substring(0, 120)}...
                    </p>
                  )}
                </div>

                {expandedSection === section.id && (
                  <div className="p-6 bg-gray-50 border-t">
                    <p className="text-gray-700 leading-relaxed">{section.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Política de cancelación */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
            <div className="flex items-start space-x-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Política de Cancelación y Reembolsos</h2>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-red-400 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancelaciones Generales</h3>
                    <ul className="text-gray-700 space-y-2">
                      <li>• <strong>Más de 30 días antes:</strong> Reembolso del 90% (10% gastos administrativos)</li>
                      <li>• <strong>15-30 días antes:</strong> Reembolso del 70%</li>
                      <li>• <strong>7-14 días antes:</strong> Reembolso del 50%</li>
                      <li>• <strong>Menos de 7 días:</strong> No reembolsable</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-orange-400 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Vuelos Internacionales</h3>
                    <p className="text-gray-700">
                      Las cancelaciones de vuelos están sujetas a las políticas de las aerolíneas. 
                      Algunos boletos pueden ser no reembolsables. Te asistimos en el proceso de 
                      cancelación cuando sea posible.
                    </p>
                  </div>

                  <div className="border-l-4 border-blue-400 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Casos de Fuerza Mayor</h3>
                    <p className="text-gray-700">
                      En casos de desastres naturales, pandemias, conflictos bélicos o restricciones 
                      gubernamentales, trabajamos para encontrar alternativas o reembolsos parciales 
                      según las políticas de los proveedores.
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-800">
                        <strong>Importante:</strong> Recomendamos contratar un seguro de viaje 
                        para protegerte contra cancelaciones imprevistas y emergencias médicas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Responsabilidades */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Responsabilidades y Limitaciones</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Nuestras Responsabilidades</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                    <div className="text-sm text-gray-700">
                      Proporcionar información precisa sobre servicios y precios
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                    <div className="text-sm text-gray-700">
                      Asistir en el proceso de reserva y confirmación
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                    <div className="text-sm text-gray-700">
                      Proporcionar soporte al cliente durante el proceso
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                    <div className="text-sm text-gray-700">
                      Proteger tu información personal según nuestra política de privacidad
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Tus Responsabilidades</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-1" />
                    <div className="text-sm text-gray-700">
                      Proporcionar información precisa y actualizada
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-1" />
                    <div className="text-sm text-gray-700">
                      Verificar documentos de viaje (pasaporte, visa)
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-1" />
                    <div className="text-sm text-gray-700">
                      Cumplir con los términos de los proveedores de servicios
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-1" />
                    <div className="text-sm text-gray-700">
                      Realizar pagos en tiempo y forma
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-3">⚠️ Limitaciones de Responsabilidad</h3>
              <div className="text-sm text-red-800 space-y-2">
                <p>• InterTravel actúa como intermediario y no es responsable por la calidad de los servicios proporcionados por terceros</p>
                <p>• No somos responsables por cambios en itinerarios debido a condiciones climáticas, huelgas o caso fortuito</p>
                <p>• La responsabilidad máxima está limitada al valor total pagado por los servicios</p>
                <p>• Recomendamos encarecidamente contratar seguro de viaje</p>
              </div>
            </div>
          </div>

          {/* Footer de contacto */}
          <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-2xl p-8 mt-8 text-center">
            <h2 className="text-2xl font-bold mb-4">¿Tienes Preguntas Legales?</h2>
            <p className="mb-6 text-gray-300">
              Nuestro equipo legal está disponible para aclarar cualquier duda sobre estos términos
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:legal@intertravel.com"
                className="bg-white text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Contactar Equipo Legal
              </a>
              <a 
                href="/politica-privacidad"
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-800 transition-colors"
              >
                Ver Política de Privacidad
              </a>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-600">
              <p className="text-sm text-gray-400">
                InterTravel S.A. | CUIT: 30-12345678-9 | Legajo EVyT: 12345 | 
                Disposición: 1234/2024 - Mendoza, Argentina
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;