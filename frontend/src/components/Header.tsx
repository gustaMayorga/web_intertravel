'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'backdrop-blur-md shadow-lg border-b' 
        : 'bg-transparent'
    }`} style={isScrolled ? {background: 'rgba(18, 28, 46, 0.95)', borderBottomColor: '#b38144'} : {}}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo Profesional con imagen real */}
          <Link href="/" className="flex items-center group">
            <div className="flex items-center space-x-3">
              {/* Logo de InterTravel */}
              <img 
                src="/logo-intertravel.png" 
                alt="InterTravel Logo" 
                className="h-12 w-auto transition-all duration-300 group-hover:scale-110"
              />
              
              {/* Texto del logo - solo en desktop */}
              <div className="hidden lg:block">
                <div className={`text-xl font-bold tracking-wider ${
                  isScrolled ? 'text-white' : 'text-white'
                }`}>
                
                </div>
                <div className={`text-xs font-semibold tracking-widest ${
                  isScrolled ? 'text-white' : 'text-blue-300'
                }`} style={isScrolled ? {color: '#b38144'} : {}}>
                 
                </div>
              </div>
            </div>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`font-semibold transition-all duration-300 hover:scale-105 relative group ${
                isScrolled 
                  ? 'text-white hover:text-[#b38144]' 
                  : 'text-white hover:text-blue-300'
              }`}
            >
              Inicio
              <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full`} style={{
                backgroundColor: isScrolled ? '#b38144' : '#93c5fd'
              }}></span>
            </Link>
            <Link 
              href="/paquetes" 
              className={`font-semibold transition-all duration-300 hover:scale-105 relative group ${
                isScrolled 
                  ? 'text-white hover:text-[#b38144]' 
                  : 'text-white hover:text-blue-300'
              }`}
            >
              Paquetes
              <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full`} style={{
                backgroundColor: isScrolled ? '#b38144' : '#93c5fd'
              }}></span>
            </Link>
            <Link 
              href="/nosotros" 
              className={`font-semibold transition-all duration-300 hover:scale-105 relative group ${
                isScrolled 
                  ? 'text-white hover:text-[#b38144]' 
                  : 'text-white hover:text-blue-300'
              }`}
            >
              Nosotros
              <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full`} style={{
                backgroundColor: isScrolled ? '#b38144' : '#93c5fd'
              }}></span>
            </Link>
            <Link 
              href="#contacto" 
              className={`font-semibold transition-all duration-300 hover:scale-105 relative group ${
                isScrolled 
                  ? 'text-white hover:text-[#b38144]' 
                  : 'text-white hover:text-blue-300'
              }`}
            >
              Contacto
              <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full`} style={{
                backgroundColor: isScrolled ? '#b38144' : '#93c5fd'
              }}></span>
            </Link>
            
            {/* RIDE */}
            <Link 
              href="/ride" 
              className="relative font-bold px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white hover:from-violet-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/>
                </svg>
                RIDE
              </span>
            </Link>
            
            {/* Portal de Agencias */}
            <a 
              href="https://intertravelgroup.paquetedinamico.com/home?tripId=4" 
              className="relative font-bold px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
                Agencias
              </span>
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`lg:hidden p-3 rounded-xl transition-all duration-300 border ${
              isScrolled 
                ? 'text-white border-[#b38144]'
                : 'text-white hover:bg-white/10 border-white/20'
            }`} style={isScrolled ? {borderColor: '#b38144'} : {}}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 backdrop-blur-md shadow-2xl border-t" style={{background: 'rgba(18, 28, 46, 0.95)', borderTopColor: '#b38144'}}>
            <nav className="flex flex-col p-6 space-y-4">
              <Link 
                href="/" 
                className="text-white hover:text-[#b38144] font-semibold py-3 px-4 rounded-lg transition-colors flex items-center gap-3"
                style={{'&:hover': {backgroundColor: 'rgba(179, 129, 68, 0.1)'}}}
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                </svg>
                Inicio
              </Link>
              <Link 
                href="/paquetes" 
                className="text-white hover:text-[#b38144] font-semibold py-3 px-4 rounded-lg transition-colors flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
                Paquetes
              </Link>
              <Link 
                href="/nosotros" 
                className="text-white hover:text-[#b38144] font-semibold py-3 px-4 rounded-lg transition-colors flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                </svg>
                Nosotros
              </Link>
              <Link 
                href="#contacto" 
                className="text-white hover:text-[#b38144] font-semibold py-3 px-4 rounded-lg transition-colors flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                Contacto
              </Link>
              
              <div className="border-t pt-4 space-y-3" style={{borderTopColor: '#b38144'}}>
                <Link 
                  href="/ride" 
                  className="bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold py-4 px-6 rounded-xl text-center hover:from-violet-700 hover:to-purple-800 transition-all shadow-lg flex items-center justify-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/>
                  </svg>
                  RIDE - Quinceañeras y Familias
                </Link>
                
                <a 
                  href="https://intertravelgroup.paquetedinamico.com/home?tripId=4" 
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-4 px-6 rounded-xl text-center hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg flex items-center justify-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                  </svg>
                  Portal Agencias
                </a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}