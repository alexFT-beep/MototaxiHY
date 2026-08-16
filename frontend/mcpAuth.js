// Se implementó el módulo MCP mcpAuth.js para autenticar contra la tabla public.user_credentials en Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || 'https://bmvhvysluevomiijncqq.supabase.co'
const SUPABASE_ANON_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdmh2eXNsdWV2b21paWpuY3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MDc2MzIsImV4cCI6MjEwMjM4MzYzMn0.hLtjoBA-rdimJeRU5_HY3gDDhywPf8NPpuPk2wCd6ew'

const API_BASE_URL = 'http://localhost:8000'

// Se inicializó la instancia del cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Se implementó la función auxiliar para limpiar y validar el número de teléfono de 9 dígitos
function cleanPhone(phone) {
  const digits = (phone || '').toString().replace(/\D/g, '')
  if (digits.length !== 9) {
    throw new Error('El teléfono debe contener exactamente 9 dígitos numéricos.')
  }
  return digits
}

// Se implementó la función signIn para autenticar contra la tabla user_credentials en Supabase
export async function signIn({ phone, password }) {
  const validPhone = cleanPhone(phone)
  
  if (!password || password.length > 12 || password.length < 6) {
    throw new Error('La contraseña debe tener entre 6 y 12 caracteres.')
  }

  // 1. Consulta directa a la tabla user_credentials en Supabase
  try {
    const { data: user, error } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('phone', validPhone)
      .eq('password', password)
      .single()

    if (!error && user) {
      const sessionData = {
        user: {
          id: user.id,
          phone: user.phone,
          user_metadata: {
            fullName: user.full_name,
            dni: user.dni,
            phone: user.phone,
            role: user.role,
            zone: user.zone,
            plateNumber: user.plate_number,
            license: user.license,
            model: user.model
          }
        }
      }
      localStorage.setItem('mototaxi_session', JSON.stringify(sessionData))
      return sessionData
    }
  } catch (err) {
    console.warn('Consulta en user_credentials no completada, intentando backend:', err)
  }

  // 2. Fallback a API Backend local si está activa
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: validPhone, password })
    })
    if (response.ok) {
      const res = await response.json()
      return res
    }
  } catch (err) {
    console.warn('Backend API no respondió:', err)
  }

  throw new Error('Número de teléfono o contraseña incorrectos. Revisa los datos e intenta nuevamente.')
}

// Se implementó la función signUp para guardar las credenciales del usuario en la tabla user_credentials
export async function signUp(userData) {
  const validPhone = cleanPhone(userData.phone)

  if (!userData.password || userData.password.length > 12 || userData.password.length < 6) {
    throw new Error('La contraseña debe tener entre 6 y 12 caracteres.')
  }


  const credentialRecord = {
    phone: validPhone,
    password: userData.password,
    full_name: userData.fullName,
    dni: userData.dni,
    role: userData.role || 'pasajero',
    zone: userData.zone || 'Centro de Huarmey',
    plate_number: userData.plateNumber || null,
    license: userData.license || null,
    model: userData.model || null
  }

  try {
    const { data, error } = await supabase.from('user_credentials').upsert(credentialRecord).select().single()
    if (!error && data) {
      const sessionData = {
        user: {
          id: data.id,
          phone: data.phone,
          user_metadata: {
            fullName: data.full_name,
            dni: data.dni,
            phone: data.phone,
            role: data.role,
            zone: data.zone,
            plateNumber: data.plate_number,
            license: data.license,
            model: data.model
          }
        }
      }
      localStorage.setItem('mototaxi_session', JSON.stringify(sessionData))
      return sessionData
    }
  } catch (err) {
    console.warn('Registro en user_credentials fallback local:', err)
  }

  return { user: { user_metadata: userData } }
}


// Se implementó la función signOut para cerrar sesión del usuario
export async function signOut() {
  if (supabase.auth && supabase.auth.signOut) {
    await supabase.auth.signOut()
  }
  localStorage.removeItem('mototaxi_session')
}

// Se implementó el listener onAuthChange para suscribirse a los cambios de estado de autenticación
export function onAuthChange(cb) {
  if (!supabase.auth || !supabase.auth.onAuthStateChange) return () => {}
  const { data: listener } = supabase.auth.onAuthStateChange((event, session) => cb(event, session))
  return () => listener?.subscription?.unsubscribe?.() || listener?.unsubscribe?.()
}

// Se implementó la función getCurrentUser para obtener los datos de la sesión activa
export async function getCurrentUser() {
  if (supabase.auth && supabase.auth.getUser) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return user
  }
  const session = localStorage.getItem('mototaxi_session')
  return session ? JSON.parse(session) : null
}


