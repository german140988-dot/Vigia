# VIGiCASA 📷
**Sistema de monitoreo de cámaras IP con IA**  
Compatible con YCC365plus · Detección de movimiento · Reconocimiento de personas

---

## 🚀 Cómo instalar en tu celular (15 minutos)

### Paso 1 — Subir a Vercel (gratis)

1. Ve a **https://vercel.com** y crea una cuenta gratuita (puedes entrar con Google)
2. Haz clic en **"Add New Project"**
3. Elige **"Upload"** (o conecta con GitHub si sabes usarlo)
4. Arrastra esta carpeta **`vigicasa`** completa
5. Vercel detecta automáticamente que es un proyecto React
6. Clic en **"Deploy"** — espera ~2 minutos
7. Vercel te da un link como: `https://vigicasa-xxx.vercel.app`

### Paso 2 — Instalar en tu celular como app

**En Android (Chrome):**
1. Abre el link de Vercel en Chrome
2. Toca el menú ⋮ (tres puntos arriba a la derecha)
3. Toca **"Agregar a pantalla de inicio"**
4. Confirma — ya aparece como app con ícono propio ✅

**En iPhone (Safari):**
1. Abre el link en Safari (no Chrome)
2. Toca el botón compartir 🔗 (abajo al centro)
3. Toca **"Agregar a pantalla de inicio"**
4. Confirma ✅

---

## ⚙️ Configuración de cámaras YCC365plus

Para conectar tus cámaras reales:

1. Abre la app **YCC365plus** en tu celular
2. Entra a tu cámara → **Ajustes** (ícono engranaje)
3. Busca **"Configuración RTSP"** o **"Protocolo RTSP"**
4. Actívalo y anota:
   - **IP de la cámara** (ej: 192.168.1.105)
   - **Usuario** (normalmente: admin)
   - **Contraseña** (la que pusiste al configurar)
   - **Puerto** (normalmente: 554)

5. En VIGiCASA, toca **+** → elige **"YCC365plus"**
6. Ingresa los datos → **"Conectar YCC365"**

> ⚠️ Las cámaras y tu celular deben estar en la **misma red WiFi** para conectarse por RTSP.

---

## 🤖 Análisis con IA (reconocimiento de personas)

1. Ve a la pestaña **"IA / Análisis"**
2. Selecciona una cámara
3. Sube una captura (foto) de esa cámara
4. Toca **"Detectar personas y movimiento"**
5. La IA analiza y te dice: cuántas personas hay, nivel de riesgo, observaciones

---

## 🛠 Desarrollo local (opcional)

Si quieres correrlo en tu computadora primero:

```bash
# Requiere Node.js 18+ instalado
cd vigicasa
npm install
npm start
# Abre http://localhost:3000
```

---

## 📁 Estructura del proyecto

```
vigicasa/
├── public/
│   ├── index.html       # HTML base con meta PWA
│   ├── manifest.json    # Config de la PWA (ícono, nombre, color)
│   ├── icon-192.png     # Ícono de la app
│   └── icon-512.png     # Ícono grande
├── src/
│   ├── index.js         # Punto de entrada React
│   └── App.jsx          # Toda la lógica de la app
└── package.json         # Dependencias
```
