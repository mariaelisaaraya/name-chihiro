# Setup Instructions

This document provides step-by-step instructions for setting up the project after deployment.

## Immediate Steps After Deployment

### 1. Ejecutar Migración de Base de Datos

**Opción A: Desde Supabase Dashboard**
1. Abre el dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "SQL Editor" en el menú lateral
4. Copia y pega el contenido de `scripts/01-setup-multiplayer-schema.sql`
5. Haz clic en "Run" para ejecutar el script

**Opción B: Desde v0 (si está disponible)**
El usuario ya aprobó ejecutar el script, pero puede ser necesario hacerlo manualmente.

### 2. Crear Bucket de Storage

1. En el dashboard de Supabase, ve a "Storage"
2. Haz clic en "Create a new bucket"
3. Nombre: `game-assets`
4. Público: **Sí** (check la opción "Public bucket")
5. Haz clic en "Create bucket"

### 3. Configurar Variables de Entorno (Opcional)

Si deployaste los contratos de Stellar:

1. Ve a la configuración del proyecto en Vercel
2. Agrega las siguientes variables:
   ```
   NEXT_PUBLIC_CHIHIRO_CONTRACT_ID=<tu-contract-id>
   NEXT_PUBLIC_ULTRAHONK_VERIFIER_ID=<tu-verifier-id>
   ```
3. Redeploy para aplicar los cambios

## Verificación

### 1. Verificar Base de Datos

Ejecuta esta query en SQL Editor:

```sql
SELECT 
  table_name 
FROM 
  information_schema.tables 
WHERE 
  table_schema = 'public' 
  AND table_name IN ('game_sessions', 'session_players', 'game_moves', 'game_assets');
```

Deberías ver las 4 tablas listadas.

### 2. Verificar Storage

1. Ve a Storage en Supabase
2. Deberías ver el bucket `game-assets`
3. Intenta subir un archivo de prueba para confirmar que funciona

### 3. Verificar la App

1. Abre tu app en Vercel: `https://tu-app.vercel.app`
2. Haz clic en "Multijugador"
3. Ingresa tu nombre y crea una sesión
4. Si ves "🟢 Conectado en tiempo real", el setup está completo

## Próximos Pasos

### Para Desarrollo Local

```bash
# 1. Clona el repo
git clone <tu-repo>
cd name-zk

# 2. Instala dependencias
pnpm install

# 3. Copia las variables de entorno
cp .env.example .env.local

# 4. Pega tus keys de Supabase (desde dashboard > Settings > API)
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# 5. Corre el servidor de desarrollo
pnpm dev

# Abre http://localhost:3000
```

### Para Deploy de Contratos (Avanzado)

Si quieres deployar tus propios contratos de Stellar:

```bash
cd gitBDB-contracts

# 1. Instala Stellar CLI
# https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup

# 2. Compila el contrato
cargo build --target wasm32v1-none --release

# 3. Sube a testnet
stellar contract upload \
  --wasm target/wasm32v1-none/release/chihiro_game.wasm \
  --source admin \
  --network testnet

# 4. Deploy
stellar contract deploy \
  --wasm-hash <HASH_FROM_UPLOAD> \
  --source admin \
  --network testnet

# 5. Guarda el CONTRACT_ID y actualiza las env vars en Vercel
```

## Troubleshooting

### "Session not found" al unirse

- Verifica que ejecutaste la migración SQL
- Verifica que las tablas existen en Supabase
- Revisa los logs en Vercel Functions

### "Storage bucket not found"

- Crea el bucket `game-assets` en Supabase Storage
- Asegúrate de que es público

### "Wallet connection failed"

- Instala Freighter extension
- Cambia a Testnet en configuración de Freighter
- Refresca la página y reintenta

### Real-time no funciona

- Verifica que Supabase Realtime está habilitado en tu proyecto
- Revisa que las tablas tienen RLS policies correctas
- Mira los logs del navegador (F12) para errores de conexión

## Soporte

Si tienes problemas:
1. Revisa los logs en Vercel: https://vercel.com/dashboard
2. Revisa los logs en Supabase: https://supabase.com/dashboard
3. Abre un issue en el repo de GitHub
