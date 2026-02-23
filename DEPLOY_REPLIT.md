# Deploy Prove-Server en Replit (GRATIS)

## Pasos:

### 1. Crea un nuevo Replit
- Ir a https://replit.com/~
- Click "Create Replit"
- Importar repo:
  ```
  https://github.com/tu-usuario/gitBDB-v10-fix-module-resolution
  ```
  (o crear uno vacío)

### 2. Configura package.json en Replit
En Replit, crear archivo `package.json` con:

```json
{
  "name": "gitbdb-prove-server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node scripts/prove-server.js"
  },
  "dependencies": {
    "@aztec/bb.js": "0.61.0",
    "@noir-lang/noir_js": "0.33.0",
    "@noir-lang/backend_barretenberg": "0.33.0"
  }
}
```

### 3. Copia archivos necesarios a Replit
```
scripts/prove-server.js            ← Main server
scripts/prove.mjs                  ← Proof generator
gitBDB-circuits/chihiro-name/      ← Circuit compilado
```

### 4. Click "Run"
Replit auto instala dependencias e inicia:
```
node scripts/prove-server.js
```

### 5. Obtén URL pública
Replit te da URL como:
```
https://nombre.replit.dev
```

### 6. Configura en Vercel
En Vercel dashboard, agrega variable de entorno:
```
VITE_PROVE_SERVER=https://nombre.replit.dev
```

---

## Test local (sin Replit)
```bash
cd gitBDB
VITE_PROVE_SERVER=http://localhost:4001 npm run dev
```

## Test en producción (con Replit)
```bash
VITE_PROVE_SERVER=https://nombre.replit.dev npm run build
vercel deploy
```

---

## ⚠️ Limitaciones de Replit Free
- El servidor duerme después de 3+ horas sin requests
- Los primeros requests pueden tardar 10-15s (cold start)
- Para evitar: usar "Replit Bouncer" (free) que lo mantiene vivo

## Alternativa: Glitch
Si Replit falla: https://glitch.com/ (mismo proceso, igual de gratis)
