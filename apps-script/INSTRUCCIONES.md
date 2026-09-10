# Cómo desplegar el backend

1. Ve a https://script.google.com/ → **Nuevo proyecto**.
2. Borra el contenido de `Code.gs` y pega todo el contenido de este `Code.gs`.
3. **Implementar** → **Nueva implementación** → ícono de engrane → tipo **Aplicación web**.
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
4. Clic en **Implementar** y autoriza los permisos de Drive y Hojas de cálculo que pida Google (es tu propia cuenta, es seguro).
5. Copia la URL que termina en `/exec`.
6. Pégala en `APPS_SCRIPT_URL` dentro de:
   - `tutoria.html`
   - `formacion-socioemocional.html`

   (busca la línea `const APPS_SCRIPT_URL = "PEGA_AQUI_LA_URL_DEL_SCRIPT";` en cada archivo).

La primera vez que alguien registre una evidencia, el script crea solo:
- Una carpeta raíz **"Evidencias CBTIS 179"** en tu Google Drive, con subcarpetas por programa, docente/grupo y actividad.
- Una hoja de cálculo **"Registro de Evidencias CBTIS 179"** con una pestaña por programa.

Si en algún momento necesitas volver a desplegar una nueva versión del código sin cambiar la URL: **Implementar → Administrar implementaciones → ✏️ Editar → Nueva versión → Implementar**.
