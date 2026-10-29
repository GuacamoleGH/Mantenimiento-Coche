# Mantenimiento Coche (Fork Personal de LubeLogger)

> Aplicación web *self-hosted* para el control exhaustivo de vehículos, mantenimientos, reparaciones, repostajes, gastos, documentación y vencimientos.

Este proyecto es un fork y evolución personalizada basada en [LubeLogger](https://github.com/hargata/lubelog) (de Hargata Softworks, licencia MIT), adaptado específicamente a las necesidades del mercado español y europeo, con una interfaz minimalista, soporte multiusuario controlado y ficha técnica detallada.

---

## ✨ Características y Evolución sobre LubeLogger

- [x] **Localización 100% en Español:** Sistema de unidades y formatos adaptados a España (€, L/100km, km, Litros, fechas `DD/MM/YYYY`).
- [x] **Ficha Técnica y Cockpit:** Panel de acceso rápido a consumibles, especificaciones de motor y estado legal sin rebuscar entre pestañas y sin truncar textos con elipsis.
- [x] **Alertas de ITV y Seguro:** Tarjetas visuales dedicadas con cuenta atrás en días para no descuidar revisiones obligatorias.
- [x] **Rediseño Visual Minimalista (UI/UX):** Garaje estilizado con matrículas europeas, tarjetas con elevación suave, pestañas de navegación estilo píldora y barra despejada con menú "Más" para opciones secundarias.
- [x] **Permisos de Garaje Compartido y Visibilidad:** Los usuarios pueden consultar los vehículos públicos de la comunidad (modo lectura), pero solo el propietario del coche (o el administrador) puede modificar o borrar sus registros.
- [x] **Autenticación Ampliada:** Inicio de sesión local con usuario/contraseña + botones directos para **Google** y **Discord** (OAuth2/OIDC).
- [x] **Entorno y Secretos Seguros:** Soporte para archivo local `.env` (ignorado en git), variables de entorno y `dotnet user-secrets`.
- [x] **Persistencia Flexible:**
  - **Local:** LiteDB embebida (cero dependencias externas en desarrollo).
  - **Servidor:** PostgreSQL nativo con contenedor Docker y script de copias de seguridad.

---

## 🛠️ Configuración de Entorno y Modo de Desarrollo (Bloque 0)

### 1. Activar Autenticación en Desarrollo Local

Por defecto en desarrollo rápido sin login, `EnableAuth` puede estar en `false` para pruebas inmediatas de interfaz. Para probar logins, registros, permisos y roles:

1. Copia el archivo de plantilla a tu `.env` local:
   ```powershell
   Copy-Item .env.example .env
   ```
2. En `.env`, configura:
   ```ini
   EnableAuth=true
   DisableRegistration=false
   ```
3. Alternativamente, usando `dotnet user-secrets` de ASP.NET Core:
   ```powershell
   dotnet user-secrets set "EnableAuth" "true"
   dotnet user-secrets set "DisableRegistration" "false"
   ```

### 2. Generar Credenciales del Usuario Root (PowerShell)

El usuario root se configura mediante hashes SHA-256 en minúsculas en hexadecimal. Ejecuta este comando en tu terminal de PowerShell para generar los hashes de tu usuario y contraseña:

```powershell
# Generar hash SHA-256 en minúsculas
$usuario = "admin"
$clave = "MiContraseñaSegura123!"

$userHash = [BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($usuario))).Replace("-","").ToLower()
$passHash = [BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($clave))).Replace("-","").ToLower()

Write-Host "UserNameHash:     $userHash"
Write-Host "UserPasswordHash: $passHash"
```

Copia ambos valores en tu `.env` o en las variables de entorno de tu servidor:
```ini
UserNameHash=tu_hash_de_usuario
UserPasswordHash=tu_hash_de_clave
```

### 3. Asignación de Coches Huérfanos (Creados sin Autenticación)

Si creaste vehículos mientras la autenticación estaba desactivada (`EnableAuth: false`), dichos coches se guardaron sin un propietario registrado.
- **Detección y reclamo automático:** Cuando el primer usuario se registra en el sistema, la aplicación detecta que es el único usuario y le asigna automáticamente los coches huérfanos existentes para que no pierda acceso de edición.
- **Asignación manual desde la UI:** Si entras como usuario Root / Administrador y editas cualquier coche (botón de lápiz o Editar Vehículo), verás un selector especial: **"Asignar Propietario (Admin/Root)"**, donde podrás reasignar el coche a cualquier usuario registrado o dejarlo como coche de flota/huérfano.

### 4. Política de Registro (`DisableRegistration`)

- **En Desarrollo:** Se recomienda `DisableRegistration=false` para poder crear la primera cuenta de usuario con la que realizar pruebas.
- **En Producción:** Se recomienda `DisableRegistration=true` una vez creada tu cuenta principal. Esto impide que cualquier persona no invitada cree cuentas en tu servidor expuesto a internet.

---

## 🚀 Inicio Rápido en Local

### Requisitos
- **[.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)** (ya verificado en Windows).
- **Git** (versión 2.40+).

### Ejecución

1. Clona tu repositorio:
   ```powershell
   git clone https://github.com/GuacamoleGH/Mantenimiento-Coche.git
   cd Mantenimiento-Coche
   ```

2. Compila y ejecuta:
   ```powershell
   dotnet run
   ```

3. Abre tu navegador en:
   ```
   http://localhost:5000
   ```

---

## 📖 Documentación Adicional

- [Guía de Compilación y Despliegue (BUILD.md)](./BUILD.md)
- [Plantilla de Variables de Entorno (.env.example)](./.env.example)

---

## ⚖️ Licencia y Atribución

Este proyecto es de código abierto bajo la [Licencia MIT](./LICENSE).
Basado originalmente en **LubeLogger** (Copyright (c) Hargata Softworks), evolucionado y personalizado por Fernando / GuacamoleGH.
