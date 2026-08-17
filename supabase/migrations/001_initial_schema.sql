-- ============================================================
-- MototaxiHY — Migración completa de base de datos en Supabase
-- Proyecto: https://bmvhvysluevomiijncqq.supabase.co
-- ============================================================

-- ============================================================
-- 1. TABLA: user_credentials
--    Login de pasajeros y mototaxistas por número de teléfono
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(9) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    dni VARCHAR(20),
    role TEXT CHECK (role IN ('pasajero', 'mototaxista')) DEFAULT 'pasajero',
    zone TEXT,
    plate_number TEXT,
    license TEXT,
    model TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. TABLA: pasajeros
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pasajeros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo TEXT NOT NULL,
    numero_documento VARCHAR(20),
    telefono VARCHAR(9) UNIQUE,
    zona_referencia TEXT,
    auth_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. TABLA: mototaxistas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mototaxistas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo TEXT NOT NULL,
    numero_placa TEXT UNIQUE,
    telefono VARCHAR(9) UNIQUE,
    zona_referencia TEXT,
    modelo_mototaxi TEXT,
    numero_licencia TEXT,
    auth_user_id UUID,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. TABLA: packages (solicitudes de viaje)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code TEXT UNIQUE,
    passenger_id UUID REFERENCES public.pasajeros(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES public.mototaxistas(id) ON DELETE SET NULL,
    passenger_name TEXT,
    passenger_phone VARCHAR(9),
    origin TEXT,
    destination TEXT,
    status TEXT DEFAULT 'Buscando Mototaxi',
    location TEXT,
    driver_name TEXT,
    driver_phone VARCHAR(9),
    driver_plate TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. TABLA: trip_locations (GPS del conductor en tiempo real)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trip_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
    driver_id UUID,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    recorded_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. REALTIME: habilitar eventos en tiempo real para packages
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.packages;

-- ============================================================
-- 7. RLS: desactivado para permitir acceso desde el cliente anon
--    (necesario para funcionar en Vercel sin backend autenticado)
-- ============================================================
ALTER TABLE public.packages        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mototaxistas    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pasajeros       DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. PERMISOS: otorgar acceso al rol anon (cliente Supabase JS)
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON public.packages        TO anon;
GRANT SELECT, INSERT, UPDATE ON public.packages        TO authenticated;
GRANT SELECT                  ON public.mototaxistas   TO anon;
GRANT SELECT                  ON public.pasajeros      TO anon;
GRANT SELECT, INSERT          ON public.user_credentials TO anon;

-- ============================================================
-- 9. DATOS INICIALES: 5 mototaxistas verificados en Huarmey
-- ============================================================
INSERT INTO public.mototaxistas (id, nombre_completo, numero_placa, telefono, zona_referencia, modelo_mototaxi, lat, lng)
VALUES
    ('66666666-6666-6666-6666-666666666666', 'Ramón "El Veloz" Gutierrez',    'HY-1234', '912345678', 'Plaza de Armas',             'Zongshen 150cc Rojo',    -10.0681, -78.1522),
    ('77777777-7777-7777-7777-777777777777', 'Luis Alberto "Tigre" Flores',   'HY-5678', '923456789', 'Mercado Modelo',             'Honda Bajaj 200 Azul',  -10.0665, -78.1535),
    ('88888888-8888-8888-8888-888888888888', 'David "El Rayo" Huanqui',       'HY-9012', '934567890', 'Hospital de Apoyo Huarmey', 'Kwanqi 150cc Amarillo', -10.0642, -78.1550),
    ('99999999-9999-9999-9999-999999999999', 'Héctor "Campeón" Salazar',      'HY-3456', '945678901', 'Terminal Panamericana Norte','Mavila 150cc Negro',    -10.0620, -78.1580),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Gonzalo "Huarmeyano" Vega',     'HY-7890', '956789012', 'Playa Tuquillo',             'Zongshen 200cc Verde',  -10.1020, -78.1820)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. DATOS INICIALES: credenciales de login (contraseña: driver123 / pasajero123)
-- ============================================================
INSERT INTO public.user_credentials (phone, password, full_name, role, zone, plate_number)
VALUES
    -- Mototaxistas
    ('912345678', 'driver123',   'Ramón "El Veloz" Gutierrez',  'mototaxista', 'Plaza de Armas',             'HY-1234'),
    ('923456789', 'driver123',   'Luis Alberto "Tigre" Flores', 'mototaxista', 'Mercado Modelo',             'HY-5678'),
    ('934567890', 'driver123',   'David "El Rayo" Huanqui',     'mototaxista', 'Hospital de Apoyo Huarmey', 'HY-9012'),
    ('945678901', 'driver123',   'Héctor "Campeón" Salazar',    'mototaxista', 'Terminal Panamericana Norte','HY-3456'),
    ('956789012', 'driver123',   'Gonzalo "Huarmeyano" Vega',   'mototaxista', 'Playa Tuquillo',             'HY-7890'),
    -- Pasajeros
    ('987123456', 'pasajero123', 'Carlos Mendoza Silva',        'pasajero',    'Plaza de Armas',             NULL),
    ('987234567', 'pasajero123', 'María Elena Torres',          'pasajero',    'Mercado Modelo',             NULL),
    ('987345678', 'pasajero123', 'Jorge Luis Ramirez',          'pasajero',    'Hospital de Apoyo Huarmey', NULL),
    ('987456789', 'pasajero123', 'Ana Sofía Morales',           'pasajero',    'Terminal Panamericana Norte',NULL),
    ('987567890', 'pasajero123', 'Pedro Pablo Castro',          'pasajero',    'Playa Tuquillo',             NULL)
ON CONFLICT (phone) DO NOTHING;
