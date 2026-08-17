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
-- 7. RLS Y POLÍTICAS DE SEGURIDAD (Security Advisor)
-- ============================================================
ALTER TABLE public.packages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mototaxistas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pasajeros        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_locations   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to packages"         ON public.packages         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to mototaxistas"     ON public.mototaxistas     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to pasajeros"        ON public.pasajeros        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to user_credentials" ON public.user_credentials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to trip_locations"   ON public.trip_locations   FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 8. PERMISOS: otorgar acceso al rol anon (cliente Supabase JS)
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON public.packages          TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.mototaxistas     TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pasajeros        TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_credentials TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.trip_locations   TO anon, authenticated;

-- ============================================================
-- 8.1 DISPARADOR AUTOMÁTICO POSTGRESQL (TRIGGER)
-- Sincroniza al instante nuevos registros directamente en la tabla mototaxistas o pasajeros
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_user_to_role_tables()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'mototaxista' THEN
        INSERT INTO public.mototaxistas (
            nombre_completo,
            numero_placa,
            telefono,
            zona_referencia,
            punto_partida_habitual,
            modelo_mototaxi,
            numero_licencia,
            dni,
            lat,
            lng
        )
        VALUES (
            NEW.full_name,
            COALESCE(NULLIF(NEW.plate_number, ''), 'HY-NUEVO'),
            NEW.phone,
            COALESCE(NULLIF(NEW.zone, ''), 'Centro de Huarmey'),
            COALESCE(NULLIF(NEW.zone, ''), 'Plaza de Armas'),
            COALESCE(NULLIF(NEW.model, ''), 'Zongshen 150cc Rojo'),
            COALESCE(NULLIF(NEW.license, ''), 'S/N'),
            COALESCE(NULLIF(NEW.dni, ''), 'S/N'),
            -10.0681 + (random() - 0.5) * 0.006,
            -78.1522 + (random() - 0.5) * 0.006
        )
        ON CONFLICT (telefono) DO UPDATE
        SET nombre_completo = EXCLUDED.nombre_completo,
            numero_placa = EXCLUDED.numero_placa,
            modelo_mototaxi = EXCLUDED.modelo_mototaxi,
            zona_referencia = EXCLUDED.zona_referencia,
            punto_partida_habitual = EXCLUDED.punto_partida_habitual,
            dni = EXCLUDED.dni;
    ELSE
        INSERT INTO public.pasajeros (
            nombre_completo,
            numero_documento,
            telefono,
            zona_referencia
        )
        VALUES (
            NEW.full_name,
            COALESCE(NULLIF(NEW.dni, ''), 'S/N'),
            NEW.phone,
            COALESCE(NULLIF(NEW.zone, ''), 'Centro de Huarmey')
        )
        ON CONFLICT (telefono) DO UPDATE
        SET nombre_completo = EXCLUDED.nombre_completo,
            zona_referencia = EXCLUDED.zona_referencia;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_user_credentials ON public.user_credentials;

CREATE TRIGGER trigger_sync_user_credentials
AFTER INSERT OR UPDATE ON public.user_credentials
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_to_role_tables();

-- ============================================================
-- 9. DATOS INICIALES: 2 mototaxistas verificados en Huarmey
-- ============================================================
INSERT INTO public.mototaxistas (id, nombre_completo, numero_placa, telefono, zona_referencia, modelo_mototaxi, lat, lng)
VALUES
    ('66666666-6666-6666-6666-666666666666', 'Ramón "El Veloz" Gutierrez',    'HY-1234', '912345678', 'Plaza de Armas', 'Zongshen 150cc Rojo',   -10.0681, -78.1522),
    ('77777777-7777-7777-7777-777777777777', 'Luis Alberto "Tigre" Flores',   'HY-5678', '923456789', 'Mercado Modelo', 'Honda Bajaj 200 Azul', -10.0665, -78.1535)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. DATOS INICIALES: credenciales de login (contraseña: driver123 / pasajero123)
-- ============================================================
INSERT INTO public.user_credentials (phone, password, full_name, role, zone, plate_number)
VALUES
    -- Mototaxistas
    ('912345678', 'driver123',   'Ramón "El Veloz" Gutierrez',  'mototaxista', 'Plaza de Armas', 'HY-1234'),
    ('923456789', 'driver123',   'Luis Alberto "Tigre" Flores', 'mototaxista', 'Mercado Modelo', 'HY-5678'),
    -- Pasajeros
    ('987123456', 'pasajero123', 'Carlos Mendoza Silva',        'pasajero',    'Plaza de Armas', NULL),
    ('987234567', 'pasajero123', 'María Elena Torres',          'pasajero',    'Mercado Modelo', NULL)
ON CONFLICT (phone) DO NOTHING;
