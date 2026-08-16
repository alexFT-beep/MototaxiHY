# MototaxiHY — Backend y MCP para Supabase

Breve guía para levantar la API en Python y los módulos MCP en JavaScript que se conectan a Supabase.

- Backend: `backend/` (FastAPI)
- Frontend MCP: `frontend/mcpAuth.js`, `frontend/mcpDashboard.js`

Requisitos:

1. Definir variables de entorno:

```
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_KEY=service-role-or-anon-key
```

2. Instalar dependencias y ejecutar la API:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

3. Uso de los MCP en JS:

- Añade `@supabase/supabase-js` a tu proyecto frontend.
- Importa `mcpAuth.js` y `mcpDashboard.js` y configura las variables de entorno para la URL y la `ANON` key.

Ejemplos rápidos (browser / bundler):

```js
import { signIn, supabase } from './frontend/mcpAuth.js'
import { fetchPackage, onPackageUpdate } from './frontend/mcpDashboard.js'

await signIn('user@example.com','password')
const pkg = await fetchPackage('package-id')

const unsub = onPackageUpdate('package-id', (err, payload) => {
  console.log('update', payload)
})

// llamar unsub() para cancelar la suscripción
```

Notas:

- Asegúrate de crear la tabla `packages` en Supabase con al menos las columnas `id`, `status`, `location`, `metadata`.
- Las funciones están escritas de forma genérica para cubrir distintas versiones del SDK; adáptalas si tu versión de `supabase-py` o `supabase-js` expone APIs distintas.
