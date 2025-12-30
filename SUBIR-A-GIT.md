# Guía para Subir el Proyecto a Git

## ✅ Estado Actual
- ✅ Repositorio Git inicializado
- ✅ Commit inicial creado
- ✅ Rama principal: `main`

## 📋 Próximos Pasos

### 1. Crear Repositorio en GitHub (si no lo tienes)

1. Ve a https://github.com/new
2. Nombre del repositorio: `lavadero-sistema` (o el que prefieras)
3. Descripción: "Sistema de gestión para lavadero de autos - MVP"
4. **NO marques** "Initialize this repository with a README"
5. Clic en "Create repository"

### 2. Conectar con el Repositorio Remoto

Ejecuta estos comandos (reemplaza `<URL_DEL_REPOSITORIO>` con la URL de tu repositorio):

```bash
# Agregar el repositorio remoto
git remote add origin <URL_DEL_REPOSITORIO>

# Verificar que se agregó correctamente
git remote -v
```

**Ejemplo:**
```bash
git remote add origin https://github.com/tu-usuario/lavadero-sistema.git
```

### 3. Subir el Código

```bash
# Subir la rama main al repositorio remoto
git push -u origin main
```

### 4. Verificar

Ve a tu repositorio en GitHub y verifica que todos los archivos estén ahí.

## 🔄 Comandos Útiles para el Futuro

### Subir cambios nuevos
```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

### Ver estado actual
```bash
git status
```

### Ver historial de commits
```bash
git log --oneline
```

## 📝 Nota sobre Archivos Excluidos

El archivo `.gitignore` está configurado para excluir:
- `node_modules/` (dependencias)
- `.next/` (build de Next.js)
- `.env` (variables de entorno - NO se suben por seguridad)
- `*.db` (bases de datos locales)
- Backups locales

## ⚠️ Importante

**NO subas el archivo `.env`** que contiene las credenciales de la base de datos. 
Ya está en `.gitignore` para proteger tu información.

Si necesitas compartir las variables de entorno con tu equipo, usa el archivo `env.example` como plantilla.

