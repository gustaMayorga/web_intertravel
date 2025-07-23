-- ===============================================
-- SCHEMA COMPLETO PARA GESTIÓN DE PAQUETES
-- Base de datos para sistema admin InterTravel
-- ===============================================

-- Tabla principal de paquetes
CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    
    -- Información básica
    title VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    duration INTEGER DEFAULT 7,
    
    -- Precios
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2) NULL,
    
    -- Descripción y contenido
    description TEXT,
    
    -- Categorización
    category VARCHAR(50) DEFAULT 'cultural',
    status VARCHAR(20) DEFAULT 'draft',
    featured BOOLEAN DEFAULT FALSE,
    
    -- Configuración del tour
    max_people INTEGER DEFAULT 20,
    min_age INTEGER DEFAULT 0,
    difficulty VARCHAR(20) DEFAULT 'easy',
    
    -- Listas en JSON
    includes JSONB DEFAULT '[]',
    excludes JSONB DEFAULT '[]',
    itinerary JSONB DEFAULT '[]',
    images JSONB DEFAULT '[]',
    landings JSONB DEFAULT '[]',
    
    -- SEO y marketing
    keywords TEXT,
    seo_title VARCHAR(255),
    seo_description TEXT,
    
    -- Métricas
    rating DECIMAL(2,1) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    bookings_count INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_category ON packages(category);
CREATE INDEX IF NOT EXISTS idx_packages_featured ON packages(featured);
CREATE INDEX IF NOT EXISTS idx_packages_destination ON packages(destination);
CREATE INDEX IF NOT EXISTS idx_packages_title ON packages USING gin(to_tsvector('spanish', title));
CREATE INDEX IF NOT EXISTS idx_packages_price ON packages(price);
CREATE INDEX IF NOT EXISTS idx_packages_created_at ON packages(created_at);

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp
DROP TRIGGER IF EXISTS update_packages_updated_at ON packages;
CREATE TRIGGER update_packages_updated_at
    BEFORE UPDATE ON packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- DATOS DE EJEMPLO PARA TESTING
-- ===============================================

INSERT INTO packages (
    title, destination, duration, price, original_price, description,
    category, status, featured, max_people, min_age, difficulty,
    includes, excludes, itinerary, images, landings, keywords,
    seo_title, seo_description, rating, reviews_count, bookings_count, revenue
) VALUES 
(
    'Perú Mágico - Machu Picchu y Cusco',
    'Cusco, Perú',
    7,
    1890.00,
    2100.00,
    'Descubre la magia del Imperio Inca en este viaje único por Perú. Explora las misteriosas ruinas de Machu Picchu, camina por las calles empedradas de Cusco y sumérgete en la rica cultura andina.',
    'cultural',
    'active',
    true,
    20,
    12,
    'moderate',
    '["Alojamiento 4 estrellas", "Desayunos incluidos", "Guía especializado en historia inca", "Transporte terrestre", "Entrada a Machu Picchu", "Tren panorámico"]',
    '["Vuelos internacionales", "Comidas no especificadas", "Gastos personales", "Propinas", "Seguros de viaje"]',
    '[{"day": 1, "title": "Llegada a Lima", "description": "Recepción en aeropuerto Jorge Chávez y traslado al hotel. Por la tarde, city tour por el centro histórico de Lima, incluyendo la Plaza Mayor, Catedral y Palacio de Gobierno.", "activities": ["Traslado aeropuerto", "Check-in hotel", "City tour Lima colonial"], "meals": {"breakfast": false, "lunch": true, "dinner": true}, "accommodation": "Hotel Lima 4★"}, {"day": 2, "title": "Lima - Cusco", "description": "Vuelo temprano a Cusco. Llegada y tiempo para aclimatación. Por la tarde, tour por el barrio de San Blas y mercado local.", "activities": ["Vuelo Lima-Cusco", "Aclimatación altitud", "Tour San Blas", "Mercado artesanal"], "meals": {"breakfast": true, "lunch": true, "dinner": false}, "accommodation": "Hotel Cusco 4★"}]',
    '[]',
    '["homepage-destacados", "cultural-landing", "destinos-especificos"]',
    'peru, machu picchu, cusco, inca, cultural, historia, arqueologia, andes, llamas',
    'Viaje a Perú - Machu Picchu y Cusco 7 días | InterTravel',
    'Descubre la magia del Imperio Inca con nuestro tour de 7 días por Perú. Incluye Machu Picchu, Cusco, Valle Sagrado y experiencias culturales únicas.',
    4.8,
    156,
    89,
    168210.00
),
(
    'Argentina Épica - Buenos Aires y Bariloche',
    'Buenos Aires, Argentina',
    10,
    2450.00,
    NULL,
    'Experimenta lo mejor de Argentina desde la vibrante Buenos Aires hasta la belleza natural de Bariloche. Una combinación perfecta de cultura urbana y naturaleza patagónica.',
    'adventure',
    'active',
    true,
    16,
    18,
    'easy',
    '["Alojamiento boutique", "Todos los desayunos", "Cena de tango en Buenos Aires", "Excursiones en Bariloche", "Cata de vinos", "Traslados privados"]',
    '["Vuelos internacionales", "Almuerzos y cenas no especificadas", "Actividades opcionales", "Bebidas alcohólicas (excepto cata)"]',
    '[]',
    '[]',
    '["homepage-destacados", "adventure-landing", "destinos-especificos"]',
    'argentina, buenos aires, bariloche, tango, patagonia, vinos, naturaleza, lagos',
    'Tour Argentina - Buenos Aires y Bariloche 10 días | InterTravel',
    'Vive Argentina en 10 días: desde el tango porteño hasta los paisajes patagónicos de Bariloche. Incluye cata de vinos y experiencias únicas.',
    4.6,
    92,
    54,
    132300.00
),
(
    'Chile Aventura - Desierto de Atacama',
    'San Pedro de Atacama, Chile',
    6,
    1650.00,
    NULL,
    'Aventúrate en el desierto más árido del mundo. Geysers, lagunas de colores, volcanes y paisajes de otro planeta te esperan en esta experiencia única.',
    'adventure',
    'active',
    false,
    12,
    16,
    'hard',
    '["Alojamiento eco-lodge", "Todas las comidas", "Guía especializado", "Transporte 4x4", "Equipo de trekking básico"]',
    '["Vuelos internacionales", "Equipo personal de trekking", "Gastos personales", "Seguro de aventura"]',
    '[]',
    '[]',
    '["adventure-landing", "destinos-especificos"]',
    'chile, atacama, desierto, geysers, volcanes, trekking, aventura, astronomia',
    'Aventura en Desierto de Atacama - Chile 6 días | InterTravel',
    'Explora el desierto más árido del mundo en una aventura de 6 días. Geysers, lagunas y paisajes únicos en Chile.',
    4.7,
    67,
    34,
    56100.00
),
(
    'México Colonial - CDMX y Guadalajara',
    'Ciudad de México, México',
    8,
    1850.00,
    NULL,
    'Sumérgete en la rica historia y cultura de México visitando dos de sus ciudades más emblemáticas.',
    'cultural',
    'draft',
    false,
    18,
    0,
    'easy',
    '["Alojamiento céntrico", "Desayunos", "Tours guiados", "Transporte interno", "Entradas a museos"]',
    '["Vuelos internacionales", "Comidas no especificadas", "Gastos personales", "Propinas"]',
    '[]',
    '[]',
    '["cultural-landing"]',
    'mexico, cdmx, guadalajara, colonial, cultura, museos, gastronomia, arte',
    'Tour México Colonial - CDMX y Guadalajara | InterTravel',
    'Descubre la riqueza cultural de México en un tour de 8 días por Ciudad de México y Guadalajara.',
    0.0,
    0,
    0,
    0.00
)
ON CONFLICT (id) DO NOTHING;

-- ===============================================
-- VISTAS ÚTILES PARA REPORTING
-- ===============================================

-- Vista de paquetes activos con métricas
CREATE OR REPLACE VIEW packages_active_stats AS
SELECT 
    id,
    title,
    destination,
    category,
    price,
    rating,
    bookings_count,
    revenue,
    CASE 
        WHEN bookings_count > 0 THEN revenue / bookings_count 
        ELSE 0 
    END as avg_booking_value,
    CASE 
        WHEN featured THEN 'Destacado'
        ELSE 'Normal'
    END as priority_level,
    created_at
FROM packages 
WHERE status = 'active'
ORDER BY revenue DESC, bookings_count DESC;

-- Vista de estadísticas por categoría
CREATE OR REPLACE VIEW packages_category_stats AS
SELECT 
    category,
    COUNT(*) as total_packages,
    COUNT(*) FILTER (WHERE status = 'active') as active_packages,
    AVG(price) as avg_price,
    SUM(bookings_count) as total_bookings,
    SUM(revenue) as total_revenue,
    AVG(rating) as avg_rating
FROM packages 
WHERE status != 'deleted'
GROUP BY category
ORDER BY total_revenue DESC;

-- Función para búsqueda full-text
CREATE OR REPLACE FUNCTION search_packages(search_term TEXT)
RETURNS TABLE (
    id INTEGER,
    title VARCHAR(255),
    destination VARCHAR(255),
    price DECIMAL(10,2),
    rating DECIMAL(2,1),
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.destination,
        p.price,
        p.rating,
        ts_rank(to_tsvector('spanish', p.title || ' ' || p.destination || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.keywords, '')), plainto_tsquery('spanish', search_term)) as rank
    FROM packages p
    WHERE 
        p.status = 'active' AND
        (
            to_tsvector('spanish', p.title || ' ' || p.destination || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.keywords, '')) 
            @@ plainto_tsquery('spanish', search_term)
        )
    ORDER BY rank DESC, p.featured DESC, p.rating DESC;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- PERMISOS Y SEGURIDAD
-- ===============================================

-- Crear usuario específico para la aplicación si no existe
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = 'intertravel_app') THEN
--         CREATE USER intertravel_app WITH PASSWORD 'secure_password_2024';
--     END IF;
-- END
-- $$;

-- Asignar permisos
-- GRANT SELECT, INSERT, UPDATE, DELETE ON packages TO intertravel_app;
-- GRANT USAGE, SELECT ON SEQUENCE packages_id_seq TO intertravel_app;
-- GRANT SELECT ON packages_active_stats TO intertravel_app;
-- GRANT SELECT ON packages_category_stats TO intertravel_app;

COMMENT ON TABLE packages IS 'Tabla principal para gestión de paquetes turísticos - Sistema Admin InterTravel';
COMMENT ON COLUMN packages.includes IS 'Lista de servicios incluidos en formato JSON';
COMMENT ON COLUMN packages.excludes IS 'Lista de servicios no incluidos en formato JSON';
COMMENT ON COLUMN packages.itinerary IS 'Itinerario detallado día a día en formato JSON';
COMMENT ON COLUMN packages.images IS 'Galería de imágenes del paquete en formato JSON';
COMMENT ON COLUMN packages.landings IS 'Landing pages donde aparece el paquete en formato JSON';

-- Verificación final
SELECT 'Schema de paquetes creado exitosamente' as status;