// Módulo MCP Dashboard — Gestión de viajes, conductores y solicitudes en tiempo real con Supabase
import { supabase } from './mcpAuth.js'

// URL base del backend local (solo activo cuando el servidor FastAPI está corriendo)
const API_BASE_URL = 'http://localhost:8000'

// Consulta los datos completos de un viaje/solicitud por su ID en la tabla packages
export async function fetchPackage(packageId) {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('id', packageId)
    .single()

  if (!error && data) return { data, error: null }

  // Fallback al backend FastAPI local si Supabase no responde
  try {
    const response = await fetch(`${API_BASE_URL}/packages/${packageId}`)
    if (response.ok) return { data: await response.json(), error: null }
  } catch (_) {}

  return { data: null, error: error?.message || 'No encontrado' }
}

// Retorna las solicitudes abiertas o dirigidas directamente a un mototaxista específico.
// Reglas de visibilidad:
//  - Solicitudes sin driver_phone y sin driver_id → visibles para TODOS los mototaxistas
//  - Solicitudes con driver_phone coincidente  → visibles SOLO para ese conductor
//  - Solicitudes con driver_id coincidente     → visibles SOLO para ese conductor
export async function fetchOpenPackageRequests(driverPhone = null, driverId = null) {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .in('status', ['Buscando Mototaxi', 'Solicitado', 'Pendiente'])
    .order('created_at', { ascending: false })

  if (!error && data) {
    const filtered = data.filter(req => {
      const isGeneral    = !req.driver_phone && !req.driver_id
      const isDirectPhone = driverPhone && req.driver_phone?.toString().trim() === driverPhone.toString().trim()
      const isDirectId    = driverId    && req.driver_id?.toString().trim()    === driverId.toString().trim()
      return isGeneral || isDirectPhone || isDirectId
    })
    return { data: filtered, error: null }
  }

  // Fallback al backend FastAPI local
  try {
    const response = await fetch(`${API_BASE_URL}/packages?status=Buscando+Mototaxi`)
    if (response.ok) return { data: await response.json(), error: null }
  } catch (_) {}

  return { data: [], error: null }
}

// Recupera la carrera activa más reciente de un pasajero (para restaurar la tarjeta de seguimiento)
export async function fetchPassengerActiveRequest(passengerPhone) {
  if (!passengerPhone) return { data: null, error: null }

  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('passenger_phone', passengerPhone)
    .in('status', ['Buscando Mototaxi', 'Solicitado', 'Asignado', 'En Camino', 'En Viaje'])
    .order('created_at', { ascending: false })
    .limit(1)

  if (!error && data?.length > 0) return { data: data[0], error: null }
  return { data: null, error: null }
}

// Realiza el seguimiento de un viaje por su código de rastreo público (ej. PK-123456)
export async function trackPackageByCode(trackingCode) {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('tracking_code', trackingCode)
    .single()

  if (!error && data) return { data, error: null }

  const response = await fetch(`${API_BASE_URL}/packages/track/${trackingCode}`)
  if (!response.ok) return { data: null, error: 'Código de seguimiento no encontrado' }
  return { data: await response.json(), error: null }
}

// Devuelve todos los conductores registrados y verificados en Huarmey.
// Si Supabase falla, retorna lista estática con coordenadas para el mapa Leaflet.
export async function fetchActiveMototaxistas() {
  const { data, error } = await supabase.from('mototaxistas').select('*')
  if (!error && data?.length > 0) return { data, error: null }

  const defaultDrivers = [
    { id: 'm1', phone: '912345678', telefono: '912345678', nombre_completo: 'Ramón "El Veloz" Gutierrez',    numero_placa: 'HY-1234', modelo_mototaxi: 'Zongshen 150cc Rojo',    zona_referencia: 'Plaza de Armas',              lat: -10.0681, lng: -78.1522 },
    { id: 'm2', phone: '923456789', telefono: '923456789', nombre_completo: 'Luis Alberto "Tigre" Flores',   numero_placa: 'HY-5678', modelo_mototaxi: 'Honda Bajaj 200 Azul',  zona_referencia: 'Mercado Modelo',               lat: -10.0665, lng: -78.1535 },
    { id: 'm3', phone: '934567890', telefono: '934567890', nombre_completo: 'David "El Rayo" Huanqui',      numero_placa: 'HY-9012', modelo_mototaxi: 'Kwanqi 150cc Amarillo', zona_referencia: 'Hospital de Apoyo Huarmey',    lat: -10.0642, lng: -78.1550 },
    { id: 'm4', phone: '945678901', telefono: '945678901', nombre_completo: 'Héctor "Campeón" Salazar',     numero_placa: 'HY-3456', modelo_mototaxi: 'Mavila 150cc Negro',    zona_referencia: 'Terminal Panamericana Norte',  lat: -10.0620, lng: -78.1580 },
    { id: 'm5', phone: '956789012', telefono: '956789012', nombre_completo: 'Gonzalo "Huarmeyano" Vega',    numero_placa: 'HY-7890', modelo_mototaxi: 'Zongshen 200cc Verde',  zona_referencia: 'Playa Tuquillo',               lat: -10.1020, lng: -78.1820 }
  ]
  return { data: defaultDrivers, error: null }
}

// Consulta en Supabase los teléfonos de conductores actualmente en viajes activos
// (estados: Asignado, En Camino, En Viaje). Usado para detectar conductores ocupados.
export async function fetchOccupiedDriverPhones() {
  const { data, error } = await supabase
    .from('packages')
    .select('driver_phone')
    .in('status', ['Asignado', 'En Camino', 'En Viaje'])

  if (!error && data) {
    return data
      .map(row => row.driver_phone?.toString().trim())
      .filter(Boolean)
  }
  return []
}

// Calcula en tiempo real qué conductores están disponibles y cuáles ocupados.
// Retorna: { data: todos, available: libres, occupiedPhones: lista de teléfonos ocupados }
export async function fetchAvailableDrivers() {
  const { data: allDrivers } = await fetchActiveMototaxistas()
  const occupiedPhones = await fetchOccupiedDriverPhones()

  if (!allDrivers) return { data: [], available: [], occupiedPhones: [] }

  const available = allDrivers.filter(driver => {
    const phone = (driver.telefono || driver.phone || '').toString().trim()
    return !occupiedPhones.includes(phone)
  })

  return { data: allDrivers, available, occupiedPhones }
}

// Crea una nueva solicitud de viaje en Supabase. Si la inserción falla, intenta el backend FastAPI local.
// Como último recurso, retorna el payload local para mantener la UI funcional.
export async function createPackageRequest(packageData) {
  const trackingCode = packageData.tracking_code || `PK-${Math.floor(100000 + Math.random() * 900000)}`
  const fullPayload = {
    tracking_code: trackingCode,
    status: 'Buscando Mototaxi',
    location: '-10.0681, -78.1522',
    created_at: new Date().toISOString(),
    ...packageData
  }

  // Intento principal: inserción directa en Supabase
  const { data, error } = await supabase
    .from('packages')
    .insert([fullPayload])
    .select()
    .single()

  if (!error && data) return { data, error: null }

  // Fallback al backend FastAPI local
  try {
    const response = await fetch(`${API_BASE_URL}/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPayload)
    })
    if (response.ok) return { data: await response.json(), error: null }
  } catch (_) {}

  // Retorno local si no hay conexión disponible (modo offline)
  return { data: fullPayload, error: null }
}

// Actualiza el estado de una solicitud en Supabase (ej. de 'Solicitado' a 'Asignado').
// También permite actualizar la ubicación y los detalles del conductor que aceptó el viaje.
export async function updatePackageStatus(packageId, status, location = null, driverDetails = {}) {
  const payload = { status, location, ...driverDetails }

  const { data, error } = await supabase
    .from('packages')
    .update(payload)
    .eq('id', packageId)
    .select()
    .single()

  if (!error && data) return { data, error: null }

  // Fallback al backend FastAPI local
  const response = await fetch(`${API_BASE_URL}/packages/${packageId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!response.ok) return { data: null, error: 'Error al actualizar el estado del viaje' }
  return { data: await response.json(), error: null }
}

// Suscripción Realtime a los cambios de una solicitud específica por ID.
// Se usa para actualizar la tarjeta de seguimiento del pasajero cuando el conductor acepta el viaje.
export function onPackageUpdate(packageId, callback) {
  try {
    const channel = supabase
      .channel(`package-changes-${packageId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'packages', filter: `id=eq.${packageId}` },
        (payload) => callback(null, payload.new)
      )
      .subscribe()

    return () => {
      try { supabase.removeChannel(channel) } catch (_) {}
    }
  } catch (_) {
    return () => {}
  }
}

// Suscripción Realtime global a todos los cambios en la tabla packages.
// Se usa en el panel del mototaxista para recibir nuevas solicitudes en tiempo real sin recargar la página.
export function subscribeToAllPackageRequests(callback) {
  try {
    const channel = supabase
      .channel('global-package-requests-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'packages' },
        (payload) => callback(null, payload)
      )
      .subscribe()

    return () => {
      try { supabase.removeChannel(channel) } catch (_) {}
    }
  } catch (_) {
    return () => {}
  }
}
