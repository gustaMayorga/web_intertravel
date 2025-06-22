// InteractiveGlobe.tsx - Versión compatible sin @react-three/fiber
'use client';

import React, { useRef, useEffect, useState } from 'react';

interface Destination {
  id: string;
  name: string;
  lat: number;
  lon: number;
  info: string;
  url?: string;
  inspired?: boolean;
}

interface InteractiveGlobeProps {
  destinations?: Destination[];
  onDestinationClick?: (destination: Destination) => void;
}

export default function InteractiveGlobe({ 
  destinations = [], 
  onDestinationClick 
}: InteractiveGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Importar Three.js dinámicamente para evitar problemas SSR
    const loadThreeJS = async () => {
      try {
        // @ts-ignore - Importación dinámica de Three.js
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        
        if (!containerRef.current) return;

        // Configuración básica de Three.js
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
          75, 
          window.innerWidth / window.innerHeight, 
          0.1, 
          1000
        );
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(renderer.domElement);

        // Controles
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 1.5;
        controls.maxDistance = 5;
        controls.enablePan = false;

        // Iluminación
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(5, 3, 5);
        scene.add(directionalLight);

        // Grupo del globo
        const globeGroup = new THREE.Group();
        scene.add(globeGroup);

        // Crear globo
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
          'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
          (texture) => {
            const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
            const sphereMaterial = new THREE.MeshStandardMaterial({
              map: texture,
              metalness: 0.3,
              roughness: 0.7,
            });
            const earth = new THREE.Mesh(sphereGeometry, sphereMaterial);
            globeGroup.add(earth);
            
            setIsLoading(false);
          },
          undefined,
          (error) => {
            console.error('Error loading texture:', error);
            setIsLoading(false);
          }
        );

        // Fondo de estrellas
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.01 });
        const starVertices = [];
        for (let i = 0; i < 10000; i++) {
          const x = (Math.random() - 0.5) * 2000;
          const y = (Math.random() - 0.5) * 2000;
          const z = (Math.random() - 0.5) * 2000;
          const distance = x*x + y*y + z*z;
          if (distance < 1000 * 1000) continue;
          starVertices.push(x, y, z);
        }
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

        // Posición inicial de cámara
        camera.position.set(0, 0, 2.5);

        // Función de animación
        function animate() {
          requestAnimationFrame(animate);
          globeGroup.rotation.y += 0.0005;
          controls.update();
          renderer.render(scene, camera);
        }

        animate();

        // Cleanup
        return () => {
          if (containerRef.current && renderer.domElement) {
            containerRef.current.removeChild(renderer.domElement);
          }
          renderer.dispose();
        };

      } catch (error) {
        console.error('Error loading Three.js:', error);
        setIsLoading(false);
      }
    };

    loadThreeJS();
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden">
      {/* Canvas Container */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      />

      {/* UI Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex gap-4">
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-blue-600/70 hover:bg-blue-600 text-white font-bold rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105"
          >
            ✨ Inspírame
          </button>
          <button className="px-6 py-3 bg-blue-600/70 hover:bg-blue-600 text-white font-bold rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105 opacity-0 invisible">
            ← Volver al Mundo
          </button>
        </div>
      </div>

      {/* Modal de IA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-200">
          <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-blue-500/30 w-90 max-w-md mx-4">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center">
              ✨ Asistente de Viajes IA
            </h2>
            <p className="text-gray-300 mb-6 text-center">
              Describe el tipo de viaje que sueñas y la IA te dará ideas.
            </p>
            <input
              type="text"
              placeholder="Ej: Aventura en la montaña..."
              className="w-full p-3 rounded-lg border border-blue-500 bg-slate-900 text-white mb-6"
            />
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors"
              >
                Cerrar
              </button>
              <button className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-bold rounded-full transition-colors">
                Generar Ideas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
