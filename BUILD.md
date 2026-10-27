# Guía de Compilación, Desarrollo y Despliegue

Esta guía describe cómo compilar y desarrollar el proyecto en local, cómo funciona su sistema de persistencia y cómo prepararlo para el futuro despliegue en un servidor doméstico (Ubuntu + Docker).

---

## 1. Desarrollo Local (Windows)

En tu equipo de desarrollo habitual no necesitas Docker ni gestores de bases de datos pesados. Todo funciona sobre el SDK nativo de .NET 8.

### Comandos habituales

- **Restaurar paquetes NuGet:**
  ```powershell
  dotnet restore
  ```

- **Compilar el proyecto:**
  ```powershell
  dotnet build
  ```

- **Arrancar en modo desarrollo (con recarga rápida):**
  ```powershell
  dotnet watch run
  ```
  *(Cualquier cambio que guardes en los archivos `.cs` o `.cshtml` se actualizará automáticamente en el navegador).*

- **Arrancar en modo estándar:**
  ```powershell
  dotnet run
  ```

Por defecto, la aplicación escuchará en `http://localhost:5000`.

---

## 2. Estructura de Persistencia en Local (LiteDB)

Cuando arrancas localmente sin configurar variables adicionales, la aplicación utiliza **LiteDB**:

```
Mantenimiento-Coche/
├── data/
│   ├── cartracker.db         <-- Base de datos completa embebida (NoSQL)
│   ├── images/               <-- Fotografías de vehículos y recibos
│   ├── documents/            <-- Facturas, PDFs y manuales
│   ├── config/               <-- userConfig.json y serverConfig.json
│   └── translations/         <-- Archivos de idiomas personalizados
```

> [!NOTE]
> La carpeta `data/` está incluida en `.gitignore`. Puedes crear coches de prueba, repostajes ficticios o borrar la carpeta sin temor a subir datos personales a GitHub.

---

## 3. Despliegue en Servidor Casero (Ubuntu + Docker)

Cuando configures tu servidor casero, el despliegue se realizará mediante **Docker Compose**.

### Estructura de producción recomendada

Para producción con **PostgreSQL**:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: lubelogger-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: lubelogger
      POSTGRES_PASSWORD: TU_CONTRASENA_SEGURA
      POSTGRES_DB: lubelogger
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - internal-net

  app:
    build: .
    container_name: lubelogger-app
    restart: unless-stopped
    environment:
      POSTGRES_CONNECTION: "Host=postgres:5432;Username=lubelogger;Password=TU_CONTRASENA_SEGURA;Database=lubelogger;"
      EnableAuth: "true"
      DisableRegistration: "true"
      # Configuración de Inicio de Sesión Social (Opcional)
      GOOGLE_CLIENT_ID: "tu-google-client-id.apps.googleusercontent.com"
      GOOGLE_CLIENT_SECRET: "tu-google-client-secret"
      DISCORD_CLIENT_ID: "tu-discord-client-id"
      DISCORD_CLIENT_SECRET: "tu-discord-client-secret"
      LUBELOGGER_DOMAIN: "https://garage.midominio.com"
    volumes:
      - appdata:/App/data
      - appkeys:/root/.aspnet/DataProtection-Keys
    ports:
      - "8080:8080"
    networks:
      - internal-net
    depends_on:
      - postgres

volumes:
  pgdata:
  appdata:
  appkeys:

networks:
  internal-net:
    driver: bridge
```

### Exposición Segura con Cloudflare Tunnel

1. No es necesario abrir puertos en el router (puerto 80 o 443 cerrados).
2. El túnel de Cloudflare apunta directamente al servicio interno `http://lubelogger-app:8080`.
3. Para una capa extra de seguridad, se puede activar **Cloudflare Access** sobre el subdominio (ej. `garage.midominio.com`) para exigir doble autenticación antes de llegar al login de la aplicación.

---

## 4. Política de Copias de Seguridad

- **Archivos y Documentos:** Copia periódica del volumen `appdata` (`/App/data`).
- **Base de Datos (LiteDB):** El archivo `data/cartracker.db` se copia junto con el resto de archivos.
- **Base de Datos (PostgreSQL):** Un script cron ejecutará periódicamente `pg_dump`:
  ```bash
  docker exec -t lubelogger-db pg_dump -U lubelogger lubelogger > backup_$(date +%Y%m%d).sql
  ```
