'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizQuestion {
  id: string;
  question: string;
  description?: string;
  type: 'single' | 'multiple' | 'range' | 'text';
  options?: { value: string; label: string; emoji?: string; image?: string }[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

interface QuizResult {
  destinationType: string;
  travelStyle: string;
  budget: string;
  duration: string;
  recommendations: any[];
  confidence: number;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'travelStyle',
    question: '¿Cuál es tu estilo de viaje ideal?',
    description: 'Esto nos ayuda a personalizar tus recomendaciones',
    type: 'single',
    options: [
      { value: 'adventure', label: 'Aventura y Adrenalina', emoji: '🏔️' },
      { value: 'cultural', label: 'Cultural e Histórico', emoji: '🏛️' },
      { value: 'relaxation', label: 'Relajación y Bienestar', emoji: '🏖️' },
      { value: 'nightlife', label: 'Vida Nocturna y Diversión', emoji: '🎉' },
      { value: 'nature', label: 'Naturaleza y Ecoturismo', emoji: '🌿' },
      { value: 'gastronomy', label: 'Gastronomía y Experiencias', emoji: '🍽️' }
    ]
  },
  {
    id: 'destination',
    question: '¿Qué tipo de destino te atrae más?',
    description: 'Piensa en el ambiente que más te emociona',
    type: 'single',
    options: [
      { value: 'tropical', label: 'Playas Tropicales', emoji: '🏝️' },
      { value: 'urban', label: 'Grandes Ciudades', emoji: '🏙️' },
      { value: 'mountain', label: 'Montañas y Lagos', emoji: '⛰️' },
      { value: 'historic', label: 'Ciudades Históricas', emoji: '🏰' },
      { value: 'exotic', label: 'Destinos Exóticos', emoji: '🌺' },
      { value: 'winter', label: 'Destinos de Invierno', emoji: '❄️' }
    ]
  },
  {
    id: 'budget',
    question: '¿Cuál es tu presupuesto aproximado por persona?',
    description: 'Incluye vuelos, alojamiento y actividades',
    type: 'single',
    options: [
      { value: 'budget', label: 'Económico', emoji: '💰', image: 'USD 800 - 1,500' },
      { value: 'mid', label: 'Medio', emoji: '💎', image: 'USD 1,500 - 3,000' },
      { value: 'premium', label: 'Premium', emoji: '👑', image: 'USD 3,000 - 5,000' },
      { value: 'luxury', label: 'Lujo', emoji: '✨', image: 'USD 5,000+' }
    ]
  },
  {
    id: 'duration',
    question: '¿Cuántos días te gustaría viajar?',
    description: 'Considera tus vacaciones disponibles',
    type: 'range',
    min: 3,
    max: 21,
    step: 1
  },
  {
    id: 'activities',
    question: '¿Qué actividades te interesan más?',
    description: 'Puedes seleccionar múltiples opciones',
    type: 'multiple',
    options: [
      { value: 'museums', label: 'Museos y Arte', emoji: '🎨' },
      { value: 'sports', label: 'Deportes Extremos', emoji: '🏄' },
      { value: 'shopping', label: 'Shopping y Moda', emoji: '🛍️' },
      { value: 'photography', label: 'Fotografía', emoji: '📸' },
      { value: 'wellness', label: 'Spa y Wellness', emoji: '🧘' },
      { value: 'festivals', label: 'Festivales y Eventos', emoji: '🎪' },
      { value: 'cuisine', label: 'Gastronomía Local', emoji: '🍜' },
      { value: 'nightlife', label: 'Vida Nocturna', emoji: '🍸' }
    ]
  },
  {
    id: 'accommodation',
    question: '¿Qué tipo de alojamiento prefieres?',
    description: 'El alojamiento puede definir tu experiencia',
    type: 'single',
    options: [
      { value: 'hotel', label: 'Hotel de Lujo', emoji: '🏨' },
      { value: 'boutique', label: 'Hotel Boutique', emoji: '🏛️' },
      { value: 'resort', label: 'Resort All-Inclusive', emoji: '🏖️' },
      { value: 'airbnb', label: 'Apartamento Local', emoji: '🏠' },
      { value: 'unique', label: 'Alojamiento Único', emoji: '🏕️' }
    ]
  },
  {
    id: 'specialRequests',
    question: '¿Algún requerimiento especial o preferencia?',
    description: 'Cuéntanos sobre restricciones alimentarias, accesibilidad, etc.',
    type: 'text',
    placeholder: 'Ej: Vegetariano, acceso para silla de ruedas, viajo con niños...'
  }
];

interface IntelligentQuizProps {
  onComplete: (result: QuizResult) => void;
  onClose: () => void;
  className?: string;
}

export default function IntelligentQuiz({ onComplete, onClose, className = '' }: IntelligentQuizProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      processResults();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const processResults = async () => {
    setIsProcessing(true);
    
    // Simular procesamiento de IA
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Algoritmo de matching inteligente
    const result = calculateRecommendations(answers);
    
    setIsProcessing(false);
    setShowResult(true);
    onComplete(result);
  };

  const calculateRecommendations = (userAnswers: Record<string, any>): QuizResult => {
    // Simular algoritmo de IA para matching
    const { travelStyle, destination, budget, duration, activities, accommodation, specialRequests } = userAnswers;
    
    // Base de datos simulada de paquetes
    const packages = [
      {
        id: 'peru-cultural',
        title: 'Perú Mágico - Cusco y Machu Picchu',
        destination: 'Cusco, Perú',
        price: 1890,
        duration: 8,
        style: ['cultural', 'adventure'],
        type: ['historic', 'mountain'],
        budget: ['mid', 'premium'],
        score: 0
      },
      {
        id: 'bali-wellness',
        title: 'Bali Espiritual - Retiro de Bienestar',
        destination: 'Bali, Indonesia',
        price: 1599,
        duration: 10,
        style: ['relaxation', 'nature'],
        type: ['tropical', 'exotic'],
        budget: ['mid'],
        score: 0
      },
      {
        id: 'tokyo-urban',
        title: 'Tokio Futurista - Cultura y Modernidad',
        destination: 'Tokio, Japón',
        price: 2850,
        duration: 12,
        style: ['cultural', 'gastronomy'],
        type: ['urban', 'exotic'],
        budget: ['premium', 'luxury'],
        score: 0
      },
      {
        id: 'patagonia-adventure',
        title: 'Patagonia Extrema - Aventura Pura',
        destination: 'Patagonia, Argentina',
        price: 2200,
        duration: 14,
        style: ['adventure', 'nature'],
        type: ['mountain', 'winter'],
        budget: ['premium'],
        score: 0
      },
      {
        id: 'maldives-luxury',
        title: 'Maldivas Exclusivas - Resort de Lujo',
        destination: 'Maldivas',
        price: 4500,
        duration: 7,
        style: ['relaxation'],
        type: ['tropical'],
        budget: ['luxury'],
        score: 0
      }
    ];

    // Calcular scores basado en matching
    packages.forEach(pkg => {
      let score = 0;
      
      // Match estilo de viaje (40% peso)
      if (pkg.style.includes(travelStyle)) score += 40;
      
      // Match tipo de destino (30% peso)
      if (pkg.type.includes(destination)) score += 30;
      
      // Match presupuesto (20% peso)
      if (pkg.budget.includes(budget)) score += 20;
      
      // Match duración (10% peso)
      const durationDiff = Math.abs(pkg.duration - duration);
      if (durationDiff <= 2) score += 10;
      else if (durationDiff <= 4) score += 5;
      
      // Bonus por actividades
      if (activities) {
        const activityBonus = activities.filter((activity: string) => {
          return (
            (activity === 'museums' && pkg.style.includes('cultural')) ||
            (activity === 'sports' && pkg.style.includes('adventure')) ||
            (activity === 'wellness' && pkg.style.includes('relaxation')) ||
            (activity === 'cuisine' && pkg.style.includes('gastronomy'))
          );
        }).length * 5;
        score += activityBonus;
      }
      
      pkg.score = score;
    });

    // Ordenar por score y tomar top 3
    const recommendations = packages
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(pkg => ({
        ...pkg,
        confidence: Math.min(95, pkg.score + Math.random() * 10)
      }));

    // Determinar tipo de destino principal
    const destinationType = getDestinationDescription(destination, travelStyle);
    
    return {
      destinationType,
      travelStyle: getTravelStyleDescription(travelStyle),
      budget: getBudgetDescription(budget),
      duration: `${duration} días`,
      recommendations,
      confidence: recommendations[0]?.confidence || 85
    };
  };

  const getDestinationDescription = (dest: string, style: string): string => {
    const descriptions: Record<string, string> = {
      tropical: 'Destinos Tropicales Paradisíacos',
      urban: 'Grandes Metrópolis Cosmopolitas',
      mountain: 'Paisajes Montañosos Impresionantes',
      historic: 'Ciudades con Rica Historia',
      exotic: 'Destinos Exóticos y Únicos',
      winter: 'Escapadas de Invierno Mágicas'
    };
    return descriptions[dest] || 'Destinos Personalizados';
  };

  const getTravelStyleDescription = (style: string): string => {
    const descriptions: Record<string, string> = {
      adventure: 'Aventurero y Activo',
      cultural: 'Explorador Cultural',
      relaxation: 'Buscador de Tranquilidad',
      nightlife: 'Amante de la Diversión',
      nature: 'Conectado con la Naturaleza',
      gastronomy: 'Explorador Gastronómico'
    };
    return descriptions[style] || 'Viajero Personalizado';
  };

  const getBudgetDescription = (budget: string): string => {
    const descriptions: Record<string, string> = {
      budget: 'Económico - Máximo Valor',
      mid: 'Medio - Equilibrio Perfecto',
      premium: 'Premium - Experiencias Especiales',
      luxury: 'Lujo - Sin Límites'
    };
    return descriptions[budget] || 'Presupuesto Flexible';
  };

  const isAnswered = () => {
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type === 'multiple') {
      return answer && answer.length > 0;
    }
    return answer !== undefined && answer !== '';
  };

  const renderQuestion = () => {
    const answer = answers[currentQuestion.id];

    switch (currentQuestion.type) {
      case 'single':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options?.map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleAnswer(currentQuestion.id, option.value)}
                className={`p-6 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105 ${
                  answer === option.value
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-3xl">{option.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{option.label}</h3>
                    {option.image && (
                      <p className="text-sm text-gray-600 mt-1">{option.image}</p>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        );

      case 'multiple':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options?.map((option, index) => {
              const isSelected = answer?.includes(option.value);
              return (
                <motion.button
                  key={option.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => {
                    const currentAnswers = answer || [];
                    const newAnswers = isSelected
                      ? currentAnswers.filter((a: string) => a !== option.value)
                      : [...currentAnswers, option.value];
                    handleAnswer(currentQuestion.id, newAnswers);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{option.emoji}</span>
                    <span className="font-medium text-gray-900">{option.label}</span>
                    {isSelected && (
                      <span className="ml-auto text-blue-500 text-xl">✓</span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        );

      case 'range':
        return (
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <div className="text-center mb-4">
                <span className="text-4xl font-bold text-blue-600">
                  {answer || currentQuestion.min} días
                </span>
              </div>
              <input
                type="range"
                min={currentQuestion.min}
                max={currentQuestion.max}
                step={currentQuestion.step}
                value={answer || currentQuestion.min}
                onChange={(e) => handleAnswer(currentQuestion.id, parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>{currentQuestion.min} días</span>
                <span>{currentQuestion.max} días</span>
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="max-w-lg mx-auto">
            <textarea
              value={answer || ''}
              onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
              placeholder={currentQuestion.placeholder}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors duration-300 resize-none"
              rows={4}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (isProcessing) {
    return (
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 ${className}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            🤖 Analizando tus preferencias...
          </h3>
          <p className="text-gray-600 mb-6">
            Nuestra IA está creando recomendaciones personalizadas perfectas para ti
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>✨ Analizando destinos compatibles...</p>
            <p>🎯 Calculando experiencias ideales...</p>
            <p>💎 Optimizando recomendaciones...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              🧠 Quiz Inteligente de Viajes
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Pregunta {currentStep + 1} de {QUIZ_QUESTIONS.length}
          </p>
        </div>

        {/* Question */}
        <div className="p-8">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
              {currentQuestion.question}
            </h3>
            {currentQuestion.description && (
              <p className="text-gray-600 text-center mb-8">
                {currentQuestion.description}
              </p>
            )}
            
            {renderQuestion()}
          </motion.div>
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            ← Anterior
          </button>
          
          <button
            onClick={handleNext}
            disabled={!isAnswered()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 hover:scale-105"
          >
            {currentStep === QUIZ_QUESTIONS.length - 1 ? '🎯 Ver Resultados' : 'Siguiente →'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}