# Guía de Contribución - Mantenimiento-Coche

¡Gracias por tu interés en colaborar en **Mantenimiento-Coche**!

Este proyecto es una evolución y fork personalizado de LubeLogger, adaptado al mercado hispanohablante y europeo (formatos de fecha, moneda en euros, consumo en L/100km, ITV, ficha técnica y diseño minimalista).

## Flujo de Trabajo y Pull Requests
1. **Crear una rama clara:** Utiliza ramas descriptivas para cada cambio o bloque (por ejemplo, `feature/auth-social`, `fix/contraste-kpi`).
2. **Compatibilidad:** Asegúrate de que el proyecto compila limpiamente en .NET 8 SDK sin romper compatibilidad entre LiteDB (local) y PostgreSQL (producción).
3. **Internacionalización y Formato:** Todos los textos de interfaz deben estar en español con sus claves correspondientes en `wwwroot/defaults/es_ES.json`.
4. **Verificación:** Antes de enviar tu PR, ejecuta `dotnet build` y comprueba que no existan errores ni regresiones visuales.

## Reporte de Problemas (Issues)
- Utiliza las plantillas de incidencias de GitHub para bugs o sugerencias.
- Proporciona pasos de reproducción, capturas de pantalla y logs de la consola en caso de error.
