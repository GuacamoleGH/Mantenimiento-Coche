# Paleta de colores para LubeLogger

Para **LubeLogger**, mantendría el amarillo corporativo `#FBC41E` como color de identidad y construiría el resto de la interfaz con una estética oscura, técnica y automovilística. Encaja bien con una aplicación de gestión del coche: mantenimiento, gastos, repostajes, revisiones, estadísticas y recordatorios.

La propuesta es una paleta tipo *automotive dashboard*: fondo azul casi negro, superficies ligeramente más claras, amarillo para las acciones importantes y colores específicos para estados y gráficos.

## 1. Paleta de colores recomendada

### Colores principales

| Uso | Color | Hex | Aplicación |
|---|---|---|---|
| Amarillo LubeLogger | ![#FBC41E](https://placehold.co/16x16/FBC41E/FBC41E.png) | `#FBC41E` | Color de marca, botones y elementos activos |
| Fondo general | ![#111722](https://placehold.co/16x16/111722/111722.png) | `#111722` | Fondo general de la aplicación |
| Superficies | ![#191F2C](https://placehold.co/16x16/191F2C/191F2C.png) | `#191F2C` | Tarjetas, paneles y modales |
| Superficie elevada | ![#252E3F](https://placehold.co/16x16/252E3F/252E3F.png) | `#252E3F` | Campos, elementos seleccionados y hover |
| Texto principal | ![#F1F5F9](https://placehold.co/16x16/F1F5F9/F1F5F9.png) | `#F1F5F9` | Títulos y contenido principal |
| Texto secundario | ![#A0AABD](https://placehold.co/16x16/A0AABD/A0AABD.png) | `#A0AABD` | Etiquetas, descripciones y metadatos |
| Bordes | ![#30394A](https://placehold.co/16x16/30394A/30394A.png) | `#30394A` | Separadores, bordes y contornos |
| Amarillo hover | ![#D6A512](https://placehold.co/16x16/D6A512/D6A512.png) | `#D6A512` | Estado hover de botones amarillos |

### Colores para estados y mantenimiento

| Estado / uso | Color | Hex | Aplicación |
|---|---|---|---|
| Verde — correcto | ![#22C55E](https://placehold.co/16x16/22C55E/22C55E.png) | `#22C55E` | Mantenimiento al día, revisión completada y gasto registrado |
| Naranja — advertencia | ![#F59E0B](https://placehold.co/16x16/F59E0B/F59E0B.png) | `#F59E0B` | Revisión próxima o mantenimiento pendiente |
| Rojo — urgente | ![#EF4444](https://placehold.co/16x16/EF4444/EF4444.png) | `#EF4444` | Mantenimiento vencido, avería o alerta crítica |
| Azul — información | ![#38BDF8](https://placehold.co/16x16/38BDF8/38BDF8.png) | `#38BDF8` | Información general, datos del vehículo y enlaces |
| Morado — estadísticas | ![#A78BFA](https://placehold.co/16x16/A78BFA/A78BFA.png) | `#A78BFA` | Gráficos secundarios, comparativas y tendencias |

**Importante:** el naranja de advertencia y el amarillo corporativo son parecidos. Reservaría el amarillo para la identidad y las acciones de la interfaz, y el naranja para advertencias que realmente requieren atención.

## 2. Ejemplo de aplicación en la interfaz

Una posible distribución del panel principal sería:

- **Cabecera:** logo LubeLogger en amarillo, texto claro y fondo oscuro.
- **Tarjetas de resumen:** superficie `#191F2C`, texto principal claro y un icono de color según el dato.
- **Kilometraje:** icono amarillo.
- **Gastos:** icono azul.
- **Próximo mantenimiento:** icono naranja para destacar la advertencia.
- **Botón principal:** fondo amarillo `#FBC41E` con texto oscuro `#111722`.
- **Botón secundario:** fondo `#252E3F`, borde `#30394A` y texto claro.
- **Barras de progreso:** amarillo para el progreso general; colores de estado cuando indiquen urgencia.

## 3. Variables CSS listas para usar

Puedes definirlas en tu hoja global y reutilizarlas en toda la aplicación.

```css
:root {
  /* Brand */
  --color-primary: #FBC41E;
  --color-primary-hover: #D6A512;
  --color-primary-soft: #3A3016;

  /* Backgrounds */
  --color-bg: #111722;
  --color-surface: #191F2C;
  --color-surface-elevated: #252E3F;
  --color-border: #30394A;

  /* Typography */
  --color-text: #F1F5F9;
  --color-text-secondary: #A0AABD;

  /* Status */
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-info: #38BDF8;
  --color-statistics: #A78BFA;
}
```

## 4. Proporción recomendada

- **70 %:** fondos oscuros y superficies neutras.
- **20 %:** texto, bordes y elementos secundarios.
- **10 %:** amarillo corporativo y colores de estado.

El amarillo debe destacar en los botones principales, iconos activos, indicadores seleccionados y pequeños detalles de marca. Evitaría usarlo como fondo de todas las tarjetas o de grandes secciones, porque perdería fuerza visual.

También mantendría el texto de los botones amarillos en `#111722`, en lugar de blanco, para conseguir una combinación más legible.

## Recomendación final

Esta paleta conserva la identidad del logo original y le da a LubeLogger una estética automovilística, técnica y moderna. La combinación de amarillo con fondos azul-negro permite destacar las acciones importantes sin recargar la interfaz.
