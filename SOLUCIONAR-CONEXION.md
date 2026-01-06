# Solucionar Problema de Conexión a PostgreSQL

## Diagnóstico

El error indica que las credenciales de PostgreSQL no son válidas o la base de datos no existe.

## Pasos para Solucionar

### 1. Verificar que PostgreSQL esté corriendo

En Windows, verifica el servicio:
- Abre "Servicios" (services.msc)
- Busca "postgresql" 
- Debe estar "En ejecución"

O desde PowerShell:
```powershell
Get-Service -Name *postgres*
```

### 2. Verificar/Actualizar Credenciales en .env

Abre el archivo `.env` en la raíz del proyecto y verifica esta línea:

```env
DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/lavadero?schema=public"
```

**Ejemplo con credenciales reales:**
```env
DATABASE_URL="postgresql://mi_usuario:mi_password123@localhost:5432/lavadero?schema=public"
```

**Importante:**
- Reemplaza `USUARIO` por tu usuario de PostgreSQL (típicamente `postgres`)
- Reemplaza `CONTRASEÑA` por tu contraseña real
- Si no tienes contraseña, déjala vacía pero mantén los dos puntos: `postgresql://postgres:@localhost...`
- El puerto por defecto es `5432`, si usas otro cámbialo

### 3. Crear la Base de Datos

Conéctate a PostgreSQL (desde pgAdmin, DBeaver, línea de comandos, etc.) y ejecuta:

```sql
CREATE DATABASE lavadero;
```

O si quieres verificarla primero:
```sql
SELECT datname FROM pg_database WHERE datname = 'lavadero';
```

Si no existe, créala:
```sql
CREATE DATABASE lavadero;
```

### 4. Probar la Conexión

Una vez actualizado el `.env` y creada la base de datos, ejecuta:

```bash
node test-connection.js
```

Deberías ver: `✅ Conexión exitosa a PostgreSQL!`

### 5. Si Todo Funciona, Continuar

```bash
npm run db:push    # Crea las tablas
npm run db:seed    # Pobla datos iniciales
npm run dev        # Inicia el servidor
```

## Verificación Rápida

**¿Cuáles son tus credenciales de PostgreSQL?**
- Usuario: ¿`postgres` u otro?
- Contraseña: ¿cuál es?
- Puerto: ¿`5432` u otro?

Una vez que tengas esto, actualiza el `.env` y vuelve a intentar.




