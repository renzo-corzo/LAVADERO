# Instrucciones para Probar la Implementación

## Opción 1: PostgreSQL (Recomendado - Soporta Enums)

### Requisitos
- PostgreSQL instalado y corriendo
- Base de datos creada

### Pasos

1. **Crear base de datos en PostgreSQL:**
```sql
CREATE DATABASE lavadero;
```

2. **Actualizar `.env` con la URL de PostgreSQL:**
```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/lavadero?schema=public"
NEXTAUTH_SECRET="desarrollo-secret-key-cambiar-en-produccion-12345678901234567890123456789012"
NEXTAUTH_URL="http://localhost:3000"
```

3. **Generar cliente de Prisma:**
```bash
npm run db:generate
```

4. **Crear tablas:**
```bash
npm run db:push
```

5. **Poblar datos iniciales:**
```bash
npm run db:seed
```

6. **Iniciar servidor:**
```bash
npm run dev
```

7. **Acceder a:**
- http://localhost:3000
- Login con: `admin` / `admin123`

---

## Opción 2: SQLite (Requiere Cambios en Schema)

Si prefieres SQLite, necesitamos convertir todos los enums a String. Esto requiere cambios más extensos en el schema.

¿Qué opción prefieres?





