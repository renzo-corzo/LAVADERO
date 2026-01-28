# Cómo ver el Modo Kiosco

## 1. Iniciar el servidor

```bash
npm run dev
```

Abre http://localhost:3000

---

## 2. Entrar como ENCARGADO o DUEÑO

El Modo Kiosco es para **quien opera** (puede o no ser lavador): **ENCARGADO** y **DUEÑO**.

### Credenciales de prueba

| Campo | Valor | Rol |
|-------|--------|-----|
| Usuario | `admin` | DUEÑO |
| Contraseña | `admin123` | |
| Usuario | `encargado` | ENCARGADO |
| Contraseña | `encargado123` | |

---

## 3. Acceder al Modo Kiosco

### Opción A: URL directa

Con sesión de **admin** o **encargado**, ve a:

**http://localhost:3000/kiosco**

### Opción B: Desde el menú (móvil)

1. Entra como **admin** o **encargado**.
2. Ve al **Tablero** (`/tablero`).
3. En **móvil** o ventana estrecha (< 1024px) verás el menú principal.
4. Toca **"Modo Kiosco"** (🖥️, fondo azul).

En desktop, usa la **URL directa** `/kiosco` si el menú no lo muestra.

---

## 4. Ver trabajos en el Kiosco

El Kiosco muestra solo OTs en **En cola** y **En proceso**.

- Si no hay ninguna → verás **"¡Todo al día!"**.
- Para probar con datos:
  1. Entra como **admin** o **encargado**.
  2. Crea una o más OTs en **Nueva OT**.
  3. Abre **/kiosco**: deberías ver esas OTs.

---

## 5. Probar en “móvil”

1. F12 → **Toggle device toolbar** (Ctrl+Shift+M).
2. Elige un dispositivo o tamaño pequeño.
3. Recarga la página.
4. Entra como **admin** o **encargado** → **Tablero** → **Modo Kiosco** en el menú.

---

## 6. Si te redirige al Tablero

- Solo **ENCARGADO** y **DUEÑO** pueden usar el Kiosco.
- Si usas otro rol, al ir a `/kiosco` te manda al tablero.
- Solución: entrar con **admin** o **encargado**.

---

## Resumen rápido

1. `npm run dev`
2. Login: **admin** / **admin123** (o **encargado** / **encargado123**)
3. Ir a **http://localhost:3000/kiosco**
4. (Opcional) Crear OTs en **Nueva OT** para verlas en el Kiosco.
