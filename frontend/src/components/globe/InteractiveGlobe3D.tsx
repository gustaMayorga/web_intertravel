'use client';

import React, { useRef, useEffect, useState } from 'react';

// Importación dinámica de Three.js para evitar errores
let THREE: any = null;

// Verificar si Three.js está disponible
const loadThreeJS = async () => {
  try {
    THREE = await import('three');
    return true;
  } catch (error) {
    console.log('Three.js no está disponible, usando fallback');
    return false;
  }
};

interface Destination {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  price: number;
  packages: number;
  category: string;
}

interface InteractiveGlobeProps {
  destinations?: Destination[];
  onDestinationClick?: (destination: Destination) => void;
  className?: string;
}

const defaultDestinations: Destination[] = [
  { id: 'paris', name: 'París', country: 'Francia', lat: 48.8566, lng: 2.3522, price: 1299, packages: 12, category: 'Romance' },
  { id: 'tokyo', name: 'Tokio', country: 'Japón', lat: 35.6762, lng: 139.6503, price: 2199, packages: 8, category: 'Cultura' },
  { id: 'cusco', name: 'Cusco', country: 'Perú', lat: -13.5319, lng: -71.9675, price: 1890, packages: 15, category: 'Aventura' },
  { id: 'cancun', name: 'Cancún', country: 'México', lat: 21.1619, lng: -86.8515, price: 1494, packages: 18, category: 'Playa' },
  { id: 'bariloche', name: 'Bariloche', country: 'Argentina', lat: -41.1335, lng: -71.3103, price: 899, packages: 10, category: 'Aventura' },
  { id: 'rio', name: 'Río de Janeiro', country: 'Brasil', lat: -22.9068, lng: -43.1729, price: 1650, packages: 14, category: 'Playa' },
  { id: 'london', name: 'Londres', country: 'Reino Unido', lat: 51.5074, lng: -0.1278, price: 1799, packages: 16, category: 'Cultura' },
  { id: 'sydney', name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, price: 2890, packages: 9, category: 'Aventura' },
];

// Componente de fallback (mapa 2D)
const FallbackGlobe = ({ destinations, onDestinationClick, className }: InteractiveGlobeProps) => {
  const [hoveredDestination, setHoveredDestination] = useState<Destination | null>(null);

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Romance': 'bg-pink-500',
      'Aventura': 'bg-orange-500',
      'Playa': 'bg-cyan-500',
      'Cultura': 'bg-purple-500',
      'Premium': 'bg-yellow-500'
    };
    return colors[category] || 'bg-blue-500';
  };

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'Romance': '💕',
      'Aventura': '🏔️',
      'Playa': '🏖️',
      'Cultura': '🏛️',
      'Premium': '⭐'
    };
    return icons[category] || '🌍';
  };

  const getMarkerPosition = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x: Math.min(Math.max(x, 2), 98), y: Math.min(Math.max(y, 2), 98) };
  };

  return (
    <div className={`relative ${className}`}>
      <div className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative">
        
        {/* Mapa de fondo estilizado */}
        <div className="absolute inset-0">
          <svg viewBox="0 0 800 400" className="w-full h-full opacity-60">
            {/* América */}
            <path d="M100 100 Q120 80 140 100 L160 120 Q180 140 160 180 L140 200 Q120 220 100 200 L80 180 Q60 160 80 120 Z" fill="#10b981" opacity="0.7" />
            {/* Europa/África */}
            <path d="M350 80 Q380 60 410 80 L440 100 Q470 120 450 160 L430 200 Q400 240 370 220 L340 200 Q310 180 330 140 Z" fill="#10b981" opacity="0.7" />
            {/* Asia */}
            <path d="M500 70 Q550 50 600 70 L650 90 Q700 110 680 150 L660 190 Q630 230 580 210 L530 190 Q480 170 500 130 Z" fill="#10b981" opacity="0.7" />
            {/* Oceanía */}
            <path d="M600 250 Q630 230 660 250 L680 270 Q700 290 680 310 L660 330 Q630 350 600 330 L580 310 Q560 290 580 270 Z" fill="#10b981" opacity="0.7" />
          </svg>
        </div>

        {/* Marcadores */}
        {destinations?.map((destination) => {
          const position = getMarkerPosition(destination.lat, destination.lng);
          return (
            <div
              key={destination.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              onMouseEnter={() => setHoveredDestination(destination)}
              onMouseLeave={() => setHoveredDestination(null)}
              onClick={() => onDestinationClick?.(destination)}
            >
              <div className={`w-4 h-4 rounded-full ${getCategoryColor(destination.category)} border-2 border-white shadow-lg transform group-hover:scale-150 transition-all duration-300 animate-pulse`} />
              <div className={`absolute inset-0 w-8 h-8 -m-2 rounded-full border-2 ${getCategoryColor(destination.category)} opacity-50 animate-ping`} />
              
              {hoveredDestination?.id === destination.id && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-3 py-2 rounded-lg whitespace-nowrap z-20">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <span>{getCategoryIcon(destination.category)}</span>
                    {destination.name}
                  </div>
                  <div className="text-xs text-gray-300">
                    ${destination.price.toLocaleString()} • {destination.packages} paquetes
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-center text-sm">
          <span className="text-yellow-400">💡</span> 
          Click en los puntos para explorar destinos
        </div>

        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm">
          {destinations?.length || 0} destinos disponibles
        </div>

        <div className="absolute top-4 left-4 bg-orange-500/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold">
          📍 Mapa 2D - Instala Three.js para 3D
        </div>
      </div>
    </div>
  );
};

// Componente 3D con Three.js
const ThreeJSGlobe = ({ destinations, onDestinationClick, className }: InteractiveGlobeProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>();
  const rendererRef = useRef<any>();
  const cameraRef = useRef<any>();
  const globeRef = useRef<any>();
  const markersRef = useRef<any>();
  const frameIdRef = useRef<number>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!mountRef.current || !THREE) return;

    try {
      initializeScene();
      createGlobe();
      createMarkers();
      addLights();
      setupControls();
      animate();
      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing globe:', err);
      setError('Error al cargar el globo 3D');
      setIsLoading(false);
    }

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  const initializeScene = () => {
    if (!mountRef.current || !THREE) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x000011);

    cameraRef.current = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    cameraRef.current.position.set(0, 0, isMobile ? 3 : 2.5);

    rendererRef.current = new THREE.WebGLRenderer({ 
      antialias: !isMobile,
      alpha: true,
      powerPreference: isMobile ? 'low-power' : 'high-performance'
    });
    rendererRef.current.setSize(width, height);
    rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
    
    mountRef.current.appendChild(rendererRef.current.domElement);
  };

  const createGlobe = () => {
    if (!sceneRef.current || !THREE) return;

    const geometry = new THREE.SphereGeometry(1, isMobile ? 32 : 64, isMobile ? 32 : 64);
    
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 256);
      gradient.addColorStop(0, '#4a90e2');
      gradient.addColorStop(0.5, '#2563eb');
      gradient.addColorStop(1, '#1e40af');
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, 512, 256);
      
      // Continentes simplificados
      context.fillStyle = '#10b981';
      context.beginPath();
      context.arc(128, 128, 40, 0, Math.PI * 2);
      context.fill();
      
      context.beginPath();
      context.arc(384, 100, 60, 0, Math.PI * 2);
      context.fill();
      
      context.beginPath();
      context.arc(256, 180, 35, 0, Math.PI * 2);
      context.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 30,
      transparent: true,
      opacity: 0.9
    });

    globeRef.current = new THREE.Mesh(geometry, material);
    sceneRef.current.add(globeRef.current);
  };

  const createMarkers = () => {
    if (!sceneRef.current || !THREE) return;

    markersRef.current = new THREE.Group();
    
    destinations?.forEach((destination) => {
      const marker = createMarker(destination);
      markersRef.current!.add(marker);
    });
    
    sceneRef.current.add(markersRef.current);
  };

  const createMarker = (destination: Destination) => {
    if (!THREE) return new THREE.Group();

    const phi = (90 - destination.lat) * (Math.PI / 180);
    const theta = (destination.lng + 180) * (Math.PI / 180);
    const radius = 1.02;
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    const markerGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({ 
      color: getCategoryColor(destination.category),
      transparent: true,
      opacity: 0.9
    });
    
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(x, y, z);
    
    const ringGeometry = new THREE.RingGeometry(0.03, 0.05, 8);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
      color: getCategoryColor(destination.category),
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(marker.position);
    ring.lookAt(0, 0, 0);
    
    marker.userData = { destination, ring };
    ring.userData = { destination, marker };
    
    const markerGroup = new THREE.Group();
    markerGroup.add(marker);
    markerGroup.add(ring);
    
    return markerGroup;
  };

  const getCategoryColor = (category: string): number => {
    const colors: { [key: string]: number } = {
      'Romance': 0xff69b4,
      'Aventura': 0xff6b35,
      'Playa': 0x00bcd4,
      'Cultura': 0x9c27b0,
      'Premium': 0xffd700
    };
    return colors[category] || 0xffd700;
  };

  const addLights = () => {
    if (!sceneRef.current || !THREE) return;

    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    sceneRef.current.add(directionalLight);

    const pointLight = new THREE.PointLight(0x4a90e2, 0.5);
    pointLight.position.set(-5, 0, 0);
    sceneRef.current.add(pointLight);
  };

  const setupControls = () => {
    if (!rendererRef.current || !cameraRef.current) return;

    const canvas = rendererRef.current.domElement;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onPointerDown = (event: PointerEvent) => {
      isDragging = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isDragging || !globeRef.current) return;

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      };

      globeRef.current.rotation.y += deltaMove.x * 0.005;
      globeRef.current.rotation.x += deltaMove.y * 0.005;
      globeRef.current.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, globeRef.current.rotation.x));

      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onPointerUp = () => { isDragging = false; };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
  };

  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    frameIdRef.current = requestAnimationFrame(animate);

    if (globeRef.current) {
      globeRef.current.rotation.y += 0.002;
    }

    if (markersRef.current) {
      markersRef.current.children.forEach((markerGroup: any) => {
        markerGroup.children.forEach((child: any) => {
          if (child.userData.marker) {
            child.rotation.z += 0.02;
            const scale = 1 + Math.sin(Date.now() * 0.003) * 0.2;
            child.scale.setScalar(scale);
          }
        });
      });
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  if (error) {
    return <FallbackGlobe destinations={destinations} onDestinationClick={onDestinationClick} className={className} />;
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mountRef} className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden" />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900/90 to-purple-900/90 rounded-2xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Cargando globo 3D...</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-center text-sm">
        <span className="text-yellow-400">💡</span> 
        {isMobile ? 'Toca y arrastra para rotar • Toca los puntos para ver destinos' : 'Arrastra para rotar • Scroll para zoom • Click en puntos para ver destinos'}
      </div>

      <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm">
        {destinations?.length || 0} destinos disponibles
      </div>

      <div className="absolute top-4 left-4 bg-green-500/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold">
        🌍 Globo 3D con Three.js
      </div>
    </div>
  );
};

export default function InteractiveGlobe({ 
  destinations = defaultDestinations, 
  onDestinationClick,
  className = ''
}: InteractiveGlobeProps) {
  const [threeJSAvailable, setThreeJSAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    loadThreeJS().then(setThreeJSAvailable);
  }, []);

  if (threeJSAvailable === null) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Verificando Three.js...</p>
          </div>
        </div>
      </div>
    );
  }

  if (threeJSAvailable) {
    return (
      <ThreeJSGlobe 
        destinations={destinations} 
        onDestinationClick={onDestinationClick} 
        className={className} 
      />
    );
  }

  return (
    <FallbackGlobe 
      destinations={destinations} 
      onDestinationClick={onDestinationClick} 
      className={className} 
    />
  );
}