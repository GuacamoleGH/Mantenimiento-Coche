# Mantenimiento Coche (Fork Personal de LubeLogger)

> Aplicación web *self-hosted* para el control exhaustivo de vehículos, mantenimientos, reparaciones, repostajes, gastos, documentación y vencimientos.

Este proyecto es un fork y evolución personalizada de [LubeLogger](https://github.com/hargata/lubelog), adaptado específicamente a las necesidades del parque automovilístico en España, con una interfaz moderna y ágil, soporte multiusuario controlado y ficha técnica detallada.

---

## 🚗 Vehículo Principal de Referencia

El diseño y los primeros módulos se optimizan para un **Mazda3 (2010, Generación BL)**:
- **Motorización:** 2.0 DISI Gasolina (código motor `LF-VD`, 151 CV / 111 kW).
- **Consumibles destacados:** Aceite motor 5W-30 / 0W-20 A5/B5, bujías de iridio, cadena de distribución.
- **Alertas legales prioritarias:** Fecha de próxima **ITV** y vencimiento de **Seguro** con avisos destacados en el panel principal.

*La aplicación es 100% configurable para admitir cualquier otro vehículo, motocicleta o furgoneta.*

---

## ✨ Características y Evolución sobre LubeLogger

- [x] **Localización 100% en Español:** Sistema de unidades y formatos adaptados a España (€, L/100km, km, Litros, fechas `DD/MM/YYYY`).
- [ ] **Ficha Técnica y Cockpit:** Panel de acceso rápido a consumibles, especificaciones de motor y estado legal sin rebuscar entre pestañas.
- [ ] **Alertas de ITV y Seguro:** Tarjetas visuales dedicadas con cuenta atrás en días para no descuidar revisiones obligatorias.
- [ ] **Rediseño Visual Moderno (UI/UX):** Interfaz limpia, barra lateral no invasiva, botones rápidos de registro (*1-Click Actions*) y diseño optimizado para móvil.
- [ ] **Permisos de Garaje Compartido:** Todos los usuarios registrados pueden consultar los vehículos de la comunidad/familia (modo lectura), pero solo el propietario puede modificar o borrar sus registros.
- [ ] **Autenticación Ampliada:** Inicio de sesión local seguro + soporte para inicio de sesión social mediante **Google** y **Discord** (OAuth2/OIDC).
- [ ] **Persistencia Flexible:**
  - **Local:** LiteDB embebida (cero dependencias externas en desarrollo).
  - **Servidor:** PostgreSQL nativo con contenedor Docker y script de copias de seguridad.

---

## 🛠️ Requisitos e Inicio Rápido en Local

### Requisitos
- **[.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)** (ya verificado en Windows).
- **Git** (versión 2.40+).

*(No se requiere Docker en el ordenador local para desarrollar o probar).*

### Ejecución en 2 pasos

1. Clona tu repositorio si aún no lo tienes:
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

Toda la información generada localmente se guarda en la carpeta local `data/` (excluida del control de versiones por `.gitignore`).

---

## 📖 Documentación

- [Guía de Compilación y Desarrollo (BUILD.md)](./BUILD.md)
- [Arquitectura de Datos y Despliegue en Servidor](./BUILD.md#despliegue-en-servidor-casero)

---

## 📄 Licencia y Atribución

Este proyecto se distribuye bajo los términos de la **Licencia MIT**.  
Basado en el trabajo original de [Hargata Softworks](https://github.com/hargata/lubelog) (Copyright © 2024 Hargata Softworks).
