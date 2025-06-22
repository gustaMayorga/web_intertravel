'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchSuggestion {
  type: 'destination' | 'experience' | 'budget' | 'duration';
  text: string;
  icon: string;
  query: string;
}

interface SmartSearchProps {
  onSearch: (query: string, filters?: any) => void;
  placeholder?: string;
  className?: string;
}

export default function SmartSearch({ onSearch, placeholder = "Ej: 'Quiero ir a un lugar tropical con mi pareja por 7 días'", className = '' }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sugerencias predefinidas inteligentes
  const SMART_SUGGESTIONS: SearchSuggestion[] = [
    { type: 'destination', text: 'Destinos románticos en Europa', icon: '💕', query: 'romantic europe destinations' },
    { type: 'experience', text: 'Aventuras en la Patagonia', icon: '🏔️', query: 'adventure patagonia hiking' },
    { type: 'destination', text: 'Playas paradisíacas del Caribe', icon: '🏖️', query: 'caribbean tropical beaches' },
    { type: 'experience', text: 'Tours gastronómicos en Asia', icon: '🍜', query: 'culinary tours asia food' },
    { type: 'budget', text: 'Viajes económicos por Sudamérica', icon: '💰', query: 'budget south america backpacking' },
    { type: 'destination', text: 'Ciudades históricas de España', icon: '🏰', query: 'historic cities spain culture' },
    { type: 'experience', text: 'Safari en África', icon: '🦁', query: 'african safari wildlife kenya' },
    { type: 'duration', text: 'Escapadas de fin de semana', icon: '⏰', query: 'weekend getaway short trips' },
    { type: 'destination', text: 'Auroras boreales en Islandia', icon: '🌌', query: 'northern lights iceland winter' },
    { type: 'experience', text: 'Yoga y meditación en Bali', icon: '🧘', query: 'wellness retreat bali yoga' }
  ];

  // Procesar consulta con NLP básico
  const processNaturalLanguage = (text: string) => {
    const lowercaseText = text.toLowerCase();
    const extractedData: any = {
      destinations: [],
      activities: [],
      budget: null,
      duration: null,
      companions: null,
      preferences: []
    };

    // Detectar destinos
    const destinationPatterns = [
      { pattern: /europa|european?/g, destinations: ['España', 'Francia', 'Italia', 'Alemania'] },
      { pattern: /asia|asian?/g, destinations: ['Japón', 'Tailandia', 'China', 'India'] },
      { pattern: /caribe|caribbean/g, destinations: ['México', 'Cuba', 'República Dominicana'] },
      { pattern: /sudamerica|south america/g, destinations: ['Argentina', 'Brasil', 'Perú', 'Chile'] },
      { pattern: /playa|beach|tropical/g, destinations: ['Cancún', 'Maldivas', 'Bali', 'Hawái'] },
      { pattern: /montaña|mountain|hiking/g, destinations: ['Patagonia', 'Alpes', 'Himalaya'] },
      { pattern: /parís|france|francia/g, destinations: ['París'] },
      { pattern: /japón|japan|tokyo|tokio/g, destinations: ['Tokio'] },
      { pattern: /perú|peru|machu\s*picchu/g, destinations: ['Cusco'] },
      { pattern: /argentina|buenos\s*aires/g, destinations: ['Buenos Aires'] }
    ];

    destinationPatterns.forEach(({ pattern, destinations }) => {
      if (pattern.test(lowercaseText)) {
        extractedData.destinations.push(...destinations);
      }
    });

    // Detectar actividades
    const activityPatterns = [
      { pattern: /aventura|adventure|hiking|trekking/g, activities: ['aventura', 'hiking'] },
      { pattern: /cultural|cultura|museo|museum/g, activities: ['cultural', 'museos'] },
      { pattern: /romántico|romantic|pareja|couple/g, activities: ['romántico'] },
      { pattern: /gastronomía|food|culinary|gastronomy/g, activities: ['gastronomía'] },
      { pattern: /relax|spa|wellness|descanso/g, activities: ['relajación', 'spa'] },
      { pattern: /fiesta|party|nightlife|vida\s*nocturna/g, activities: ['vida nocturna'] }
    ];

    activityPatterns.forEach(({ pattern, activities }) => {
      if (pattern.test(lowercaseText)) {
        extractedData.activities.push(...activities);
      }
    });

    // Detectar duración
    const durationMatch = lowercaseText.match(/(\d+)\s*(días?|days?|semanas?|weeks?)/);
    if (durationMatch) {
      const number = parseInt(durationMatch[1]);
      const unit = durationMatch[2];
      if (unit.includes('semana') || unit.includes('week')) {
        extractedData.duration = number * 7;
      } else {
        extractedData.duration = number;
      }
    }

    // Detectar presupuesto
    const budgetPatterns = [
      { pattern: /económico|barato|budget|cheap/g, budget: 'budget' },
      { pattern: /medio|medium|moderado/g, budget: 'mid' },
      { pattern: /premium|caro|expensive|lujo|luxury/g, budget: 'premium' }
    ];

    budgetPatterns.forEach(({ pattern, budget }) => {
      if (pattern.test(lowercaseText)) {
        extractedData.budget = budget;
      }
    });

    // Detectar compañía
    const companionPatterns = [
      { pattern: /pareja|couple|romantic|romántico/g, companions: 'pareja' },
      { pattern: /familia|family|niños|kids/g, companions: 'familia' },
      { pattern: /amigos|friends|grupo/g, companions: 'amigos' },
      { pattern: /solo|alone|individual/g, companions: 'solo' }
    ];

    companionPatterns.forEach(({ pattern, companions }) => {
      if (pattern.test(lowercaseText)) {
        extractedData.companions = companions;
      }
    });

    return extractedData;
  };

  // Generar sugerencias dinámicas basadas en la entrada
  const generateSuggestions = (searchText: string) => {
    if (searchText.length < 3) {
      return SMART_SUGGESTIONS.slice(0, 6);
    }

    const processed = processNaturalLanguage(searchText);
    const dynamicSuggestions: SearchSuggestion[] = [];

    // Sugerencias basadas en destinos detectados
    if (processed.destinations.length > 0) {
      processed.destinations.forEach((dest: string) => {
        dynamicSuggestions.push({
          type: 'destination',
          text: `Explorar ${dest} en detalle`,
          icon: '🌍',
          query: `${dest} travel packages`
        });
      });
    }

    // Sugerencias basadas en actividades
    if (processed.activities.length > 0) {
      processed.activities.forEach((activity: string) => {
        dynamicSuggestions.push({
          type: 'experience',
          text: `Experiencias de ${activity}`,
          icon: '✨',
          query: `${activity} experiences travel`
        });
      });
    }

    // Sugerencias de duración si se detectó
    if (processed.duration) {
      dynamicSuggestions.push({
        type: 'duration',
        text: `Viajes de ${processed.duration} días`,
        icon: '📅',
        query: `${processed.duration} days travel packages`
      });
    }

    // Combinar con sugerencias generales si necesario
    const remainingSlots = 6 - dynamicSuggestions.length;
    if (remainingSlots > 0) {
      const filtered = SMART_SUGGESTIONS.filter(s => 
        s.text.toLowerCase().includes(searchText.toLowerCase())
      );
      dynamicSuggestions.push(...filtered.slice(0, remainingSlots));
    }

    return dynamicSuggestions.length > 0 ? dynamicSuggestions : SMART_SUGGESTIONS.slice(0, 6);
  };

  // Efectos
  useEffect(() => {
    if (query.length > 0) {
      const newSuggestions = generateSuggestions(query);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    setIsProcessing(true);
    setShowSuggestions(false);

    // Procesar con NLP
    const processedData = processNaturalLanguage(finalQuery);
    
    // Simular procesamiento de IA
    await new Promise(resolve => setTimeout(resolve, 800));

    // Ejecutar búsqueda con filtros extraídos
    onSearch(finalQuery, processedData);
    setIsProcessing(false);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
    if (query.length === 0) {
      setSuggestions(SMART_SUGGESTIONS.slice(0, 6));
      setShowSuggestions(true);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Barra de búsqueda principal */}
      <motion.div
        animate={{
          scale: isExpanded ? 1.02 : 1,
          boxShadow: isExpanded 
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl border-2 border-gray-200 focus-within:border-blue-500 overflow-hidden"
      >
        <div className="flex items-center p-4">
          {/* Icono de búsqueda */}
          <div className="flex-shrink-0 mr-4">
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>

          {/* Input de búsqueda */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={isProcessing}
            className="flex-1 text-lg placeholder-gray-400 focus:outline-none disabled:opacity-50"
          />

          {/* Botón de búsqueda */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSearch()}
            disabled={!query.trim() || isProcessing}
            className="ml-4 bg-blue-600 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
          >
            {isProcessing ? 'Procesando...' : 'Buscar'}
          </motion.button>
        </div>

        {/* Indicador de IA */}
        {query.length > 10 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pb-2"
          >
            <div className="flex items-center text-sm text-blue-600">
              <span className="mr-2">🤖</span>
              <span>IA analizando tu consulta...</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Panel de sugerencias */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
          >
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">
                💡 Sugerencias inteligentes
              </h3>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={`${suggestion.type}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3 border-b border-gray-50 last:border-b-0"
                >
                  <span className="text-2xl flex-shrink-0">{suggestion.icon}</span>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{suggestion.text}</p>
                    <p className="text-sm text-gray-500 capitalize">{suggestion.type.replace('_', ' ')}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              ))}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-600 text-center">
                ✨ Usa lenguaje natural: "Quiero ir a París con mi pareja por una semana"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ejemplos de búsqueda rápida */}
      {!isExpanded && !query && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SMART_SUGGESTIONS.slice(0, 4).map((suggestion, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSuggestionClick(suggestion)}
              className="inline-flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105"
            >
              <span>{suggestion.icon}</span>
              <span>{suggestion.text}</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}