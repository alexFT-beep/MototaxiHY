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

// Función auxiliar para extraer los últimos 9 dígitos de un número telefónico
function get9Digits(phone) {
  if (!phone) return ''
  const digits = phone.toString().replace(/\D/g, '')
  return digits.length >= 9 ? digits.slice(-9) : digits
}

// Retorna las solicitudes abiertas o dirigidas directamente a un mototaxista específico.
// Reglas de visibilidad:
//  - Solicitudes sin driver_phone y sin driver_id → visibles para TODOS los mototaxistas
//  - Solicitudes con coincidencia por teléfono (9 dígitos), ID o Nombre → visibles para ese conductor
export async function fetchOpenPackageRequests(driverPhone = null, driverId = null, driverName = null) {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .in('status', ['Buscando Mototaxi', 'Solicitado', 'Pendiente'])
    .order('created_at', { ascending: false })

  if (!error && data) {
    const cleanDriverPhone = get9Digits(driverPhone)
    const cleanDriverName  = (driverName || '').toString().toLowerCase().trim()

    const filtered = data.filter(req => {
      // 1. Solicitud abierta a cualquier mototaxi
      const isGeneral = (!req.driver_phone || req.driver_phone.toString().trim() === '') &&
                        (!req.driver_id || req.driver_id.toString().trim() === '')

      // 2. Coincidencia por teléfono (últimos 9 dígitos)
      const reqPhone = get9Digits(req.driver_phone)
      const isDirectPhone = cleanDriverPhone && reqPhone && reqPhone === cleanDriverPhone

      // 3. Coincidencia por ID de conductor
      const isDirectId = driverId && req.driver_id && req.driver_id.toString().trim() === driverId.toString().trim()

      // 4. Coincidencia por nombre de conductor (respaldo)
      const reqDriverName = (req.driver_name || '').toString().toLowerCase().trim()
      const isDirectName  = cleanDriverName && reqDriverName && reqDriverName.length > 2 &&
                            (reqDriverName.includes(cleanDriverName) || cleanDriverName.includes(reqDriverName))

      return isGeneral || isDirectPhone || isDirectId || isDirectName
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

// Devuelve todos los conductores registrados y verificados en Huarmey (consultando tanto mototaxistas como user_credentials)
export async function fetchActiveMototaxistas() {
  try {
    const { data: dbMototaxistas } = await supabase.from('mototaxistas').select('*')
    const { data: credDrivers } = await supabase.from('user_credentials').select('*').eq('role', 'mototaxista')

    const driverMap = new Map()

    if (dbMototaxistas) {
      dbMototaxistas.forEach(d => {
        const phone = (d.telefono || d.phone || '').toString().trim()
        if (phone) {
          driverMap.set(phone, {
            id: d.id,
            phone: phone,
            telefono: phone,
            nombre_completo: d.nombre_completo || d.full_name || 'Mototaxista Verificado',
            numero_placa: d.numero_placa || d.plate_number || 'S/N',
            modelo_mototaxi: d.modelo_mototaxi || d.model || 'Mototaxi 150cc Rojo',
            zona_referencia: d.zona_referencia || d.zone || 'Centro de Huarmey',
            lat: d.lat || (-10.0681 + (Math.random() - 0.5) * 0.005),
            lng: d.lng || (-78.1522 + (Math.random() - 0.5) * 0.005)
          })
        }
      })
    }

    if (credDrivers) {
      credDrivers.forEach(d => {
        const phone = (d.phone || '').toString().trim()
        if (phone && !driverMap.has(phone)) {
          driverMap.set(phone, {
            id: d.id,
            phone: phone,
            telefono: phone,
            nombre_completo: d.full_name || 'Mototaxista Verificado',
            numero_placa: d.plate_number || 'HY-NUEVO',
            modelo_mototaxi: d.model || 'Mototaxi 150cc Rojo',
            zona_referencia: d.zone || 'Centro de Huarmey',
            lat: -10.0681 + (Math.random() - 0.5) * 0.005,
            lng: -78.1522 + (Math.random() - 0.5) * 0.005
          })
        }
      })
    }

    const allDrivers = Array.from(driverMap.values())
    if (allDrivers.length > 0) return { data: allDrivers, error: null }
  } catch (err) {
    console.warn('Error al obtener mototaxistas:', err)
  }

  const defaultDrivers = [
    { id: 'm1', phone: '912345678', telefono: '912345678', nombre_completo: 'Ramón "El Veloz" Gutierrez',  numero_placa: 'HY-1234', modelo_mototaxi: 'Zongshen 150cc Rojo',  zona_referencia: 'Plaza de Armas', lat: -10.0681, lng: -78.1522 },
    { id: 'm2', phone: '923456789', telefono: '923456789', nombre_completo: 'Luis Alberto "Tigre" Flores', numero_placa: 'HY-5678', modelo_mototaxi: 'Honda Bajaj 200 Azul', zona_referencia: 'Mercado Modelo',  lat: -10.0665, lng: -78.1535 }
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
// Usa WebSocket de Supabase + polling de respaldo cada 5s para garantizar funcionamiento en Vercel.
export function onPackageUpdate(packageId, callback) {
  let lastStatus = null
  let pollInterval = null

  // Canal Realtime principal (WebSocket)
  let channel = null
  try {
    channel = supabase
      .channel(`package-update-${packageId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'packages', filter: `id=eq.${packageId}` },
        (payload) => {
          lastStatus = payload.new?.status
          callback(null, payload.new)
        }
      )
      .subscribe((status) => {
        // Si el WebSocket falla, activar polling como respaldo
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          startPolling()
        }
      })
  } catch (_) {}

  // Polling de respaldo: consulta Supabase cada 5 segundos si el WebSocket no responde
  function startPolling() {
    if (pollInterval) return
    pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single()
      if (data && data.status !== lastStatus) {
        lastStatus = data.status
        callback(null, data)
      }
    }, 5000)
  }

  // Siempre iniciar polling como respaldo adicional (garantía en producción)
  startPolling()

  return () => {
    if (pollInterval) clearInterval(pollInterval)
    try { supabase.removeChannel(channel) } catch (_) {}
  }
}

// Suscripción Realtime global a todos los cambios en la tabla packages.
// Se usa en el panel del mototaxista para recibir nuevas solicitudes sin recargar la página.
// Dual: WebSocket Supabase + polling cada 5s como respaldo en producción (Vercel).
export function subscribeToAllPackageRequests(callback) {
  let pollInterval = null
  let lastCount = null
  let lastUpdatedAt = null

  // Canal Realtime principal (WebSocket)
  let channel = null
  try {
    channel = supabase
      .channel('global-packages-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'packages' },
        (payload) => {
          callback(null, payload)
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          startPolling()
        }
      })
  } catch (_) {}

  // Polling de respaldo cada 5 segundos — detecta nuevas solicitudes aunque el WebSocket falle
  function startPolling() {
    if (pollInterval) return
    pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('packages')
        .select('id, updated_at, status')
        .in('status', ['Buscando Mototaxi', 'Solicitado', 'Pendiente', 'Asignado'])
        .order('updated_at', { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        const newest = data[0]
        if (newest.updated_at !== lastUpdatedAt) {
          lastUpdatedAt = newest.updated_at
          callback(null, { new: newest })
        }
      }
    }, 5000)
  }

  // Siempre iniciar polling como garantía adicional en producción
  startPolling()

  return () => {
    if (pollInterval) clearInterval(pollInterval)
    try { supabase.removeChannel(channel) } catch (_) {}
  }
}

