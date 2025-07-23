// 🧹 Script de Limpieza de Storage - InterTravel Admin
// ==================================================

(function() {
    console.log('🧹 Iniciando limpieza de storage problemático...');
    
    try {
        // 1. Verificar estado actual
        const currentToken = localStorage.getItem('auth_token');
        const currentUser = sessionStorage.getItem('auth_user');
        
        console.log('📊 Estado actual:', {
            hasToken: !!currentToken,
            hasUser: !!currentUser,
            tokenType: currentToken ? (currentToken.startsWith('demo_') ? 'demo' : 'backend') : null
        });
        
        // 2. Limpiar tokens inválidos o corruptos
        if (currentToken && !currentToken.startsWith('demo_') && !currentToken.match(/^[a-zA-Z0-9._-]+$/)) {
            console.log('🗑️ Removiendo token corrupto');
            localStorage.removeItem('auth_token');
        }
        
        // 3. Verificar consistencia entre token y usuario
        const hasToken = !!localStorage.getItem('auth_token');
        const hasUser = !!sessionStorage.getItem('auth_user');
        
        if (hasToken !== hasUser) {
            console.log('🔄 Inconsistencia detectada entre token y usuario, limpiando todo');
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_user');
        }
        
        // 4. Validar formato del usuario
        if (currentUser) {
            try {
                const parsedUser = JSON.parse(currentUser);
                if (!parsedUser.username || !parsedUser.role) {
                    console.log('🗑️ Usuario con formato inválido, limpiando');
                    sessionStorage.removeItem('auth_user');
                    localStorage.removeItem('auth_token');
                }
            } catch (e) {
                console.log('🗑️ Usuario no es JSON válido, limpiando');
                sessionStorage.removeItem('auth_user');
                localStorage.removeItem('auth_token');
            }
        }
        
        // 5. Limpiar otros datos problemáticos relacionados
        const keysToCheck = ['auth_error', 'auth_redirect', 'auth_retry'];
        keysToCheck.forEach(key => {
            if (localStorage.getItem(key) || sessionStorage.getItem(key)) {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
                console.log(`🗑️ Limpiado ${key}`);
            }
        });
        
        // 6. Estado final
        const finalToken = localStorage.getItem('auth_token');
        const finalUser = sessionStorage.getItem('auth_user');
        
        console.log('✅ Limpieza completada. Estado final:', {
            hasToken: !!finalToken,
            hasUser: !!finalUser,
            isConsistent: (!!finalToken) === (!!finalUser)
        });
        
        // 7. Crear evento personalizado para notificar cambios
        window.dispatchEvent(new CustomEvent('authStorageCleared', {
            detail: { 
                cleaned: true, 
                timestamp: new Date().toISOString() 
            }
        }));
        
    } catch (error) {
        console.error('❌ Error durante limpieza de storage:', error);
        
        // Limpieza de emergencia
        try {
            localStorage.clear();
            sessionStorage.clear();
            console.log('🆘 Limpieza de emergencia completada');
        } catch (e) {
            console.error('💥 Falló incluso la limpieza de emergencia:', e);
        }
    }
})();

// Función global para limpieza manual
window.clearAuthStorage = function() {
    console.log('🔧 Limpieza manual iniciada...');
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    console.log('✅ Limpieza manual completada');
    return { success: true, timestamp: new Date().toISOString() };
};

// Función para verificar estado de auth
window.checkAuthStatus = function() {
    return {
        token: localStorage.getItem('auth_token'),
        user: sessionStorage.getItem('auth_user'),
        parsedUser: (() => {
            try {
                return JSON.parse(sessionStorage.getItem('auth_user') || 'null');
            } catch {
                return null;
            }
        })(),
        timestamp: new Date().toISOString()
    };
};

console.log('🎯 Storage cleaner loaded. Available functions: clearAuthStorage(), checkAuthStatus()');
