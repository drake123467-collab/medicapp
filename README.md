# 💊 MedicApp — Recordatorio de Medicamentos

App web progresiva (PWA) para administrar y recordar medicamentos con alarmas push.

## Características

- 📋 **Vista diaria**: lista de medicamentos del día con check de "tomado"
- 💊 **Gestión**: agregá, editá, pausá o eliminá medicamentos
- ⏰ **Alarmas reales**: notificaciones push enviadas desde el servidor (funcionan con pantalla apagada)
- 📱 **Instalable en Android**: sin Play Store, directo desde Chrome
- 🔄 **Sincronizado**: administrás desde cualquier dispositivo, el celular recibe las alarmas

---

## 🚀 Deploy en Railway

### Paso 1: Clonar y subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/medicapp.git
git push -u origin main
```

### Paso 2: Generar claves VAPID (solo una vez)

```bash
npm install
node -e "const w=require('web-push'); const k=w.generateVAPIDKeys(); console.log('PUBLIC:', k.publicKey); console.log('PRIVATE:', k.privateKey);"
```

Guardá las claves — las vas a necesitar en el próximo paso.

### Paso 3: Crear proyecto en Railway

1. Entrá a [railway.app](https://railway.app) y creá una cuenta
2. "New Project" → "Deploy from GitHub repo" → seleccioná tu repo
3. Ir a **Variables** y agregar:

| Variable | Valor |
|----------|-------|
| `VAPID_PUBLIC_KEY` | La clave pública generada |
| `VAPID_PRIVATE_KEY` | La clave privada generada |
| `VAPID_EMAIL` | `mailto:tu@email.com` |

4. Railway hace el deploy automáticamente (tarda ~2 min)
5. Copiá la URL pública del proyecto (ej: `https://medicapp-production.up.railway.app`)

### Paso 4: Actualizar la clave pública en el cliente

Abrí `server/index.js` y reemplazá las claves de ejemplo con las tuyas:

```js
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'TU_CLAVE_PUBLICA_AQUI';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'TU_CLAVE_PRIVADA_AQUI';
```

---

## 📱 Instalar en el celular (Android)

1. Abrí la URL de Railway en **Chrome para Android**
2. Tocá el menú ⋮ → **"Añadir a pantalla de inicio"**
3. Aceptá → la app se instala como si fuera nativa
4. Abrí la app instalada → ir a **Config.** → **Activar alarmas**
5. Aceptá los permisos de notificaciones
6. Tocá "Enviar prueba" para verificar que funciona

---

## 🏃 Desarrollo local

```bash
# Terminal 1 — Backend
npm install
node server/index.js

# Terminal 2 — Frontend
cd client
npm install
npm run dev
```

Abrí `http://localhost:5173`

---

## 📁 Estructura del proyecto

```
medicapp/
├── server/
│   ├── index.js          # Express + cron + web-push
│   ├── data.json         # Medicamentos (se crea automáticamente)
│   └── subscriptions.json # Suscripciones push (se crea automáticamente)
├── client/
│   ├── src/
│   │   ├── App.jsx       # App principal con navegación
│   │   ├── components/
│   │   │   ├── MedicationCard.jsx
│   │   │   ├── MedicationForm.jsx
│   │   │   ├── NotificationsPanel.jsx
│   │   │   └── TodayView.jsx
│   │   └── hooks/api.js  # Llamadas al backend
│   └── public/
│       └── sw.js         # Service worker para notificaciones
├── railway.toml          # Configuración Railway
└── package.json          # Scripts de build
```

---

## ⚠️ Notas importantes

- Los datos se guardan en **archivos JSON** en el servidor. Railway tiene almacenamiento persistente en el plan gratuito, pero si el server se reinicia los datos se mantienen.
- Para más robustez, se puede migrar a una base de datos (Railway ofrece PostgreSQL gratis).
- Las notificaciones push **requieren HTTPS** — Railway lo provee automáticamente.
- En iOS (iPhone), las PWA tienen soporte limitado para notificaciones push (requiere iOS 16.4+). En Android funciona perfectamente.
