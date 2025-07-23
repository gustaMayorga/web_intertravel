-- ===============================================
-- SISTEMA DE PALABRAS CLAVE PRIORITARIAS
-- ===============================================

-- Tabla para palabras clave de priorización
CREATE TABLE IF NOT EXISTS priority_keywords (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(100) NOT NULL UNIQUE,
    priority INTEGER NOT NULL DEFAULT 1, -- 1 = mayor prioridad
    active BOOLEAN DEFAULT true,
    category VARCHAR(50) DEFAULT 'general',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

-- Tabla para banners configurables
CREATE TABLE IF NOT EXISTS admin_banners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(300),
    description TEXT,
    image_url VARCHAR(500),
    button_text VARCHAR(100),
    button_url VARCHAR(500),
    background_color VARCHAR(20) DEFAULT '#ffffff',
    text_color VARCHAR(20) DEFAULT '#000000',
    position VARCHAR(50) DEFAULT 'hero', -- hero, sidebar, footer, etc.
    active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar palabras clave de ejemplo
INSERT INTO priority_keywords (keyword, priority, category, description, created_by) VALUES
('charter', 1, 'transport', 'Vuelos charter prioritarios', 'admin'),
('perú', 2, 'destination', 'Destino Perú prioritario', 'admin'),
('MSC', 3, 'cruise', 'Cruceros MSC prioritarios', 'admin'),
('intertravel', 1, 'agency', 'Paquetes InterTravel', 'admin'),
('enzo.vingoli', 1, 'agency', 'Paquetes enzo.vingoli', 'admin'),
('premium', 4, 'category', 'Paquetes premium', 'admin'),
('luxury', 5, 'category', 'Paquetes de lujo', 'admin'),
('wine', 6, 'experience', 'Tours de vino', 'admin'),
('mendoza', 3, 'destination', 'Destino Mendoza', 'admin'),
('patagonia', 4, 'destination', 'Destino Patagonia', 'admin')
ON CONFLICT (keyword) DO NOTHING;

-- Insertar banners de ejemplo
INSERT INTO admin_banners (name, title, subtitle, description, image_url, button_text, button_url, position, order_index) VALUES
('hero_main', 'Descubre el Mundo con InterTravel', 'Experiencias únicas e inolvidables', 'Los mejores destinos del mundo te esperan. Paquetes exclusivos con la calidad que nos caracteriza.', 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=600&fit=crop', 'Ver Paquetes', '/packages', 'hero', 1),
('promo_wine', '🍷 Tours de Vino en Mendoza', 'Experiencia Premium en la Capital del Vino', 'Descubre los mejores viñedos de Mendoza con nuestros tours exclusivos. Degustaciones, cenas gourmet y alojamiento de lujo.', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop', 'Reservar Ahora', '/packages?search=mendoza+wine', 'sidebar', 2),
('offer_peru', '🏔️ Perú Mágico - Oferta Especial', 'Machu Picchu y mucho más', 'Conoce las maravillas del imperio Inca. Paquetes completos con guías especializados y experiencias auténticas.', 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&h=400&fit=crop', 'Ver Ofertas', '/packages?search=peru', 'card', 3)
ON CONFLICT (name) DO NOTHING;

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_priority_keywords_priority ON priority_keywords(priority);
CREATE INDEX IF NOT EXISTS idx_priority_keywords_active ON priority_keywords(active);
CREATE INDEX IF NOT EXISTS idx_admin_banners_position ON admin_banners(position, order_index);
CREATE INDEX IF NOT EXISTS idx_admin_banners_active ON admin_banners(active);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para auto-update de timestamps
DROP TRIGGER IF EXISTS update_priority_keywords_updated_at ON priority_keywords;
CREATE TRIGGER update_priority_keywords_updated_at 
    BEFORE UPDATE ON priority_keywords 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_banners_updated_at ON admin_banners;
CREATE TRIGGER update_admin_banners_updated_at 
    BEFORE UPDATE ON admin_banners 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
