# Rotación de secretos y limpieza del repositorio

Este documento resume **riesgos típicos** cuando un repositorio fue o es público y contenía referencias a entornos reales, y qué rotar **ya**.

## 1. Qué podía estar expuesto

- **`DATABASE_URL`** en archivos `.md`, `.txt` de despliegue o informes (incluye usuario y contraseña de PostgreSQL).
- **`NEXTAUTH_SECRET`** como literal en documentación o commits antiguos.
- **URLs de producción** fijas (p. ej. dominio Vercel) que facilitan enumeración o pruebas contra un objetivo conocido.
- **Credenciales de seed / desarrollo** documentadas (`admin123`, `encargado123`, `lavador123`) si alguna vez se usaron en producción.
- **Enlaces a GitHub** con usuario/organización reales (no son secretos criptográficos, pero aumentan la superficie de ingeniería social).

Los archivos `VARIABLES-*.txt`, `URL-VERCEL-ACTUAL.txt` y varios informes fueron **sanitizados** para usar placeholders. El archivo **`.env` local no debe subirse** (está en `.gitignore`).

## 2. Qué rotar de inmediato (si hubo exposición)

1. **Contraseña del rol de base de datos** en Neon (u otro proveedor): generar nueva contraseña y actualizar `DATABASE_URL` en **todos** los entornos (Vercel, local, CI).
2. **`NEXTAUTH_SECRET`**: generar uno nuevo (`openssl rand -base64 32` o equivalente) y actualizarlo en el hosting; esto **invalida sesiones JWT** existentes.
3. **Contraseñas de usuarios** que coincidan con las del seed o con claves débiles usadas en demos: cambiarlas en la BD o forzar reset.
4. Revisar en **Neon / Vercel** usuarios invitados, IP allowlists y logs de acceso recientes.

## 3. Cómo regenerar `NEXTAUTH_SECRET`

```bash
openssl rand -base64 32
```

Copiar el resultado en la variable de entorno `NEXTAUTH_SECRET` del proyecto (Vercel → Settings → Environment Variables, etc.). Volver a desplegar la aplicación.

## 4. Contraseñas seed / por defecto

El seed (`prisma/seed.ts`) puede usar `SEED_ADMIN_PASSWORD`, `SEED_ENCARGADO_PASSWORD`, `SEED_LAVADOR_PASSWORD`. Si esas claves existieron en producción o en un repo público, **cámbielas en la base** y no reutilice los valores por defecto en producción.

## 5. Invalidar sesiones

Al cambiar `NEXTAUTH_SECRET`, las sesiones firmadas con el valor anterior dejan de ser válidas: los usuarios deberán iniciar sesión de nuevo. No es necesario un paso extra salvo que use almacenamiento de sesión distinto de JWT.

## 6. Revisiones recomendadas en Neon / Vercel

- Neon: rotar contraseña de la base, revisar branches y puntos de conexión expuestos.
- Vercel: confirmar que las variables sensibles no estén en Preview para forks no confiables; revisar colaboradores del equipo.

## 7. Buenas prácticas a futuro

- Nunca commitear `.env` ni URLs con credenciales.
- Usar solo placeholders en documentación (`postgresql://USUARIO:CONTRASEÑA@HOST/...`).
- Tratar cualquier secreto que haya estado en Git remoto como **comprometido** hasta rotarlo.
