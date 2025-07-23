"use client";

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [debugInfo, setDebugInfo] = useState<string>('Cargando...');

  useEffect(() => {
    const testImports = async () => {
      try {
        console.log(' Testing imports...');
        
        // Test 1: Import api-client directly
        const { apiClient } = await import('@/services/api-client');
        console.log(' apiClient imported:', apiClient);
        console.log(' apiClient.getUserBookings:', typeof apiClient?.getUserBookings);
        console.log(' apiClient.getUserStats:', typeof apiClient?.getUserStats);
        
        // Test 2: Import bookings-service
        const { bookingsService } = await import('@/services/bookings-service-fixed');
        console.log(' bookingsService imported:', bookingsService);
        console.log(' bookingsService.getUserBookings:', typeof bookingsService?.getUserBookings);
        console.log(' bookingsService.getUserStats:', typeof bookingsService?.getUserStats);
        
        // Test 3: Try to call methods
        let testResult = 'Tests:\n';
        testResult += `apiClient exists: ${!!apiClient}\n`;
        testResult += `apiClient.getUserBookings: ${typeof apiClient?.getUserBookings}\n`;
        testResult += `apiClient.getUserStats: ${typeof apiClient?.getUserStats}\n`;
        testResult += `bookingsService exists: ${!!bookingsService}\n`;
        testResult += `bookingsService.getUserBookings: ${typeof bookingsService?.getUserBookings}\n`;
        testResult += `bookingsService.getUserStats: ${typeof bookingsService?.getUserStats}\n`;
        
        setDebugInfo(testResult);
        
      } catch (error) {
        console.error(' Import test failed:', error);
        setDebugInfo(`Error: ${error.message}`);
      }
    };

    testImports();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard Debug</h1>
      <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap">
        {debugInfo}
      </pre>
      <div className="mt-4">
        <p>Revisa la consola del navegador para logs detallados.</p>
      </div>
    </div>
  );
}
