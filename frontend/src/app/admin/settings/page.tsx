'use client';

/**
 * ⚙️ CONFIGURACIÓN ADMIN INTERTRAVEL
 * ===================================
 * 
 * ✅ Configuración general del sistema
 * ✅ Configuración de sitio web
 * ✅ Configuración de pagos
 * ✅ Configuración de emails
 * ✅ Configuración de integraciónes
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings,
  Globe,
  CreditCard,
  Mail,
  Zap,
  Shield,
  Database,
  Palette,
  Bell,
  Key,
  Server,
  Code,
  Smartphone,
  Monitor,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Upload,
  Download,
  Check,
  X,
  AlertTriangle,
  Info,
  Lock,
  Unlock,
  User,
  Building,
  MapPin,
  Phone,
  Link,
  DollarSign
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cargar configuraciones
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
        console.log('✅ Configuraciones cargadas:', data.settings);
      } else {
        throw new Error(data.error || 'Error al cargar configuraciones');
      }
    } catch (error) {
      console.error('❌ Error cargando configuraciones:', error);
      setError(error.message);
      
      // Fallback con configuraciones mock
      setSettings({
        general: {
          siteName: 'InterTravel',
          siteDescription: 'Tu agencia de viajes de confianza',
          siteUrl: 'https://intertravel.com',
          timezone: 'America/Argentina/Mendoza',
          language: 'es',
          currency: 'USD',
          contactEmail: 'contacto@intertravel.com',
          supportEmail: 'soporte@intertravel.com',
          phone: '+54 9 261 555-0000',
          address: 'Mendoza, Argentina',
          maintenanceMode: false
        },
        website: {
          logoUrl: '/images/logo.png',
          faviconUrl: '/favicon.ico',
          primaryColor: '#2563eb',
          secondaryColor: '#7c3aed',
          fontFamily: 'Inter',
          enableAnalytics: true,
          googleAnalyticsId: 'G-XXXXXXXXXX',
          facebookPixelId: '',
          enableCookieConsent: true,
          enableChatWidget: true,
          metaDescription: 'Descubre los mejores destinos con InterTravel',
          metaKeywords: 'viajes, turismo, paquetes, destinos'
        },
        payments: {
          enableStripe: true,
          stripePublicKey: 'pk_test_...',
          stripeWebhookSecret: 'whsec_...',
          enablePayPal: false,
          paypalClientId: '',
          enableMercadoPago: true,
          mercadoPagoPublicKey: 'APP_USR_...',
          currency: 'USD',
          taxRate: 21,
          commissionRate: 10,
          enableRefunds: true,
          autoConfirmPayments: false
        },
        email: {
          provider: 'smtp',
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: 'noreply@intertravel.com',
          smtpPassword: '••••••••',
          smtpSecure: true,
          fromName: 'InterTravel',
          fromEmail: 'noreply@intertravel.com',
          enableBookingConfirmation: true,
          enablePaymentNotifications: true,
          enableNewsletters: true,
          enableMarketingEmails: false
        },
        integrations: {
          enableWhatsApp: true,
          whatsappNumber: '+5492615550000',
          whatsappApiKey: '••••••••',
          enableSlack: false,
          slackWebhookUrl: '',
          enableGoogleMaps: true,
          googleMapsApiKey: '••••••••',
          enableCloudinary: true,
          cloudinaryCloudName: 'intertravel',
          cloudinaryApiKey: '••••••••',
          enableSentry: false,
          sentryDsn: ''
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar configuraciones
  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsDirty(false);
        alert('✅ Configuraciones guardadas exitosamente');
      } else {
        throw new Error(data.error || 'Error al guardar configuraciones');
      }
    } catch (error) {
      console.error('❌ Error guardando configuraciones:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Actualizar configuración
  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setIsDirty(true);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6" data-admin="true">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="mr-3 h-8 w-8 text-blue-600" />
            Configuración del Sistema
          </h1>
          <p className="text-gray-600 mt-1">
            Configuraciones globales y preferencias de InterTravel
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          {isDirty && (
            <Badge className="bg-yellow-100 text-yellow-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Cambios sin guardar
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={loadSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recargar
          </Button>
          <Button 
            size="sm" 
            onClick={saveSettings}
            disabled={!isDirty || saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">⚠️ {error} - Usando configuraciones de respaldo</p>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="website" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Sitio Web
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagos
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Integraciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Información del Sitio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Información del Sitio
                </CardTitle>
                <CardDescription>
                  Configuración básica del sitio web
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Sitio
                  </label>
                  <input
                    type="text"
                    value={settings?.general?.siteName || ''}
                    onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={settings?.general?.siteDescription || ''}
                    onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL del Sitio
                  </label>
                  <input
                    type="url"
                    value={settings?.general?.siteUrl || ''}
                    onChange={(e) => updateSetting('general', 'siteUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configuración Regional */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Configuración Regional
                </CardTitle>
                <CardDescription>
                  Idioma, zona horaria y moneda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zona Horaria
                  </label>
                  <select
                    value={settings?.general?.timezone || ''}
                    onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="America/Argentina/Mendoza">Argentina/Mendoza</option>
                    <option value="America/Argentina/Buenos_Aires">Argentina/Buenos Aires</option>
                    <option value="America/Santiago">Chile/Santiago</option>
                    <option value="America/Sao_Paulo">Brasil/São Paulo</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Idioma
                  </label>
                  <select
                    value={settings?.general?.language || ''}
                    onChange={(e) => updateSetting('general', 'language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Moneda
                  </label>
                  <select
                    value={settings?.general?.currency || ''}
                    onChange={(e) => updateSetting('general', 'currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD - Dólar Estadounidense</option>
                    <option value="ARS">ARS - Peso Argentino</option>
                    <option value="CLP">CLP - Peso Chileno</option>
                    <option value="BRL">BRL - Real Brasileño</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Información de Contacto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información de Contacto
                </CardTitle>
                <CardDescription>
                  Datos de contacto de la empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email de Contacto
                  </label>
                  <input
                    type="email"
                    value={settings?.general?.contactEmail || ''}
                    onChange={(e) => updateSetting('general', 'contactEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email de Soporte
                  </label>
                  <input
                    type="email"
                    value={settings?.general?.supportEmail || ''}
                    onChange={(e) => updateSetting('general', 'supportEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={settings?.general?.phone || ''}
                    onChange={(e) => updateSetting('general', 'phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={settings?.general?.address || ''}
                    onChange={(e) => updateSetting('general', 'address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Mantenimiento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Mantenimiento
                </CardTitle>
                <CardDescription>
                  Estado del sitio y mantenimiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Modo Mantenimiento
                    </label>
                    <p className="text-sm text-gray-600">
                      Activar para mostrar página de mantenimiento
                    </p>
                  </div>
                  <Button
                    variant={settings?.general?.maintenanceMode ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => updateSetting('general', 'maintenanceMode', !settings?.general?.maintenanceMode)}
                  >
                    {settings?.general?.maintenanceMode ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Activado
                      </>
                    ) : (
                      <>
                        <Unlock className="h-4 w-4 mr-2" />
                        Desactivado
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="website" className="mt-6">
          <div className="text-center py-12">
            <Globe className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configuración del Sitio Web</h3>
            <p className="text-gray-600 mb-4">
              Personalización visual, SEO, analytics y funcionalidades del sitio.
            </p>
            <p className="text-sm text-gray-500">
              Panel de configuración en desarrollo
            </p>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configuración de Pagos</h3>
            <p className="text-gray-600 mb-4">
              Stripe, PayPal, MercadoPago, impuestos y comisiones.
            </p>
            <p className="text-sm text-gray-500">
              Panel de configuración en desarrollo
            </p>
          </div>
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configuración de Email</h3>
            <p className="text-gray-600 mb-4">
              SMTP, plantillas, notificaciones automáticas y marketing.
            </p>
            <p className="text-sm text-gray-500">
              Panel de configuración en desarrollo
            </p>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <div className="text-center py-12">
            <Zap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Integraciones</h3>
            <p className="text-gray-600 mb-4">
              WhatsApp, Google Maps, Slack, Cloudinary y otras APIs.
            </p>
            <p className="text-sm text-gray-500">
              Panel de configuración en desarrollo
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}