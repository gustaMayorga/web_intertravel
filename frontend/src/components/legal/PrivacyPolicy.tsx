'use client';

import React from 'react';
import { Shield, Lock, Eye, FileText, Mail, Phone, Calendar } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <Shield className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Política de Privacidad</h1>
          </div>
          <p className="text-center text-xl text-blue-100 max-w-3xl mx-auto">
            En InterTravel, protegemos tu información personal con los más altos estándares de seguridad
          </p>
          <div className="text-center mt-4">
            <span className="bg-blue-500 px-4 py-2 rounded-full text-sm">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-l-4 border-blue-600">
            <div className="flex items-start space-x-4">
              <Lock className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Introducción</h2>
                <p className="text-gray-700 leading-relaxed">
                  En InterTravel ("nosotros", "nuestro" o "la empresa"), respetamos tu privacidad y nos comprometemos 
                  a proteger tu información personal. Esta Política de Privacidad explica cómo recopilamos, 
                  utilizamos, divulgamos y protegemos tu información cuando utilizas nuestros servicios de agencia 
                  de viajes en línea.
                </p>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>📍 Datos de contacto:</strong><br />
                    InterTravel - Agencia de Viajes<br />
                    Email: privacidad@intertravel.com<br />
                    Teléfono: +54 261 123-4567<br />
                    Mendoza, Argentina
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Información que recopilamos */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-start space-x-4">
              <Eye className="w-6 h-6 text-green-600 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Información que Recopilamos</h2>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-green-400 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Información Personal Directa</h3>
                    <ul className="text-gray-700 space-y-2">
                      <li>• <strong>Datos de contacto:</strong> Nombre, apellido, email, teléfono</li>
                      <li>• <strong>Datos de identificación:</strong> DNI, pasaporte, fecha de nacimiento</li>
                      <li>• <strong>Información de viaje:</strong> Preferencias, destinos, fechas</li>
                      <li>• <strong>Datos de pago:</strong> Información de tarjetas de crédito (encriptada)</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-blue-400 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Información Técnica Automática</h3>
                    <ul className="text-gray-700 space-y-2">
                      <li>• <strong>Datos de navegación:</strong> IP, navegador, dispositivo</li>
                      <li>• <strong>Cookies y tecnologías similares:</strong> Para mejorar la experiencia</li>
                      <li>• <strong>Análisis de uso:</strong> Páginas visitadas, tiempo de navegación</li>
                      <li>• <strong>Geolocalización:</strong> Solo con tu consentimiento explícito</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-purple-400 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Información de Terceros</h3>
                    <ul className="text-gray-700 space-y-2">
                      <li>• <strong>Redes sociales:</strong> Si vinculas tu cuenta de Facebook/Google</li>
                      <li>• <strong>Proveedores de viajes:</strong> Aerolíneas, hoteles, tours</li>
                      <li>• <strong>Sistemas de pago:</strong> MercadoPago, PayPal, bancos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cómo utilizamos la información */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-start space-x-4">
              <FileText className="w-6 h-6 text-orange-600 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Cómo Utilizamos tu Información</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-orange-900 mb-3">🎯 Servicios Principales</h3>
                    <ul className="text-sm text-orange-800 space-y-1">
                      <li>• Procesar reservas y pagos</li>
                      <li>• Gestionar tu cuenta de usuario</li>
                      <li>• Proporcionar atención al cliente</li>
                      <li>• Enviar confirmaciones y actualizaciones</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-3">📊 Mejora de Servicios</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Personalizar recomendaciones</li>
                      <li>• Analizar tendencias de uso</li>
                      <li>• Mejorar funcionalidades</li>
                      <li>• Desarrollar nuevos servicios</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-3">📢 Comunicación</h3>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Newsletters promocionales</li>
                      <li>• Ofertas especiales personalizadas</li>
                      <li>• Encuestas de satisfacción</li>
                      <li>• Actualizaciones de políticas</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-3">🛡️ Seguridad Legal</h3>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>• Cumplir obligaciones legales</li>
                      <li>• Prevenir fraudes</li>
                      <li>• Resolver disputas</li>
                      <li>• Proteger derechos y seguridad</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tus derechos */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tus Derechos de Privacidad</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Acceso</h3>
                <p className="text-sm text-blue-800">
                  Solicitar una copia de tu información personal que procesamos
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">✏️ Rectificación</h3>
                <p className="text-sm text-green-800">
                  Corregir información inexacta o incompleta
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-900 mb-2">🗑️ Eliminación</h3>
                <p className="text-sm text-red-800">
                  Solicitar la eliminación de tu información personal
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">⏸️ Limitación</h3>
                <p className="text-sm text-orange-800">
                  Restringir el procesamiento de tu información
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">📤 Portabilidad</h3>
                <p className="text-sm text-purple-800">
                  Recibir tu información en formato estructurado
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">❌ Oposición</h3>
                <p className="text-sm text-gray-800">
                  Oponerte al procesamiento por marketing directo
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
              <h3 className="font-semibold text-gray-900 mb-2">🚨 Cómo Ejercer tus Derechos</h3>
              <div className="flex flex-col sm:flex-row gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>privacidad@intertravel.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span>+54 261 123-4567</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <span>Respuesta en 30 días</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">¿Tienes Preguntas sobre Privacidad?</h2>
            <p className="mb-6 text-blue-100">
              Nuestro equipo de privacidad está aquí para ayudarte
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:privacidad@intertravel.com"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Contactar Equipo de Privacidad
              </a>
              <a 
                href="/politica-cookies"
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Ver Política de Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;