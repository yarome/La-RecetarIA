# La RecetarIA

Aplicación personal para gestionar un libro de recetas, planificar la semana y generar la lista de la compra. Funciona en dos modos: **invitado** (todo se guarda solo en tu navegador) y **usuario registrado** (cuentas creadas previamente y datos por usuario en el servidor).

## Características

### Catálogo de recetas
- Alta, edición y borrado de recetas con imagen opcional, vídeo de origen, etiquetas libres, ingredientes (nombre, cantidad y unidad), pasos y datos nutricionales por ración base (kcal, proteínas, carbohidratos, azúcares, grasas y fibra).
- Marcado de favoritos con un toque y vista responsive de tarjetas (1, 2 o 3 columnas según el ancho de pantalla).
- Detalle de receta a pantalla completa con escalado automático de ingredientes y nutrición al cambiar el número de raciones.

### Categorías y búsqueda
- Agrupación de recetas en categorías (carpetas) creadas por el usuario.
- Categoría **Favoritos** fija e imborrable.
- Buscador por nombre, etiqueta o ingrediente y filtros rápidos por etiqueta.

### El menú y el planificador semanal
- Selección de recetas para la semana en curso con ajuste de raciones por receta.
- Tablero **drag-and-drop** por día (lunes a domingo) y comida (desayuno, comida, cena y *snack* opcional por día).
- Cálculo automático de totales nutricionales por día y para toda la semana.
- **Objetivos nutricionales semanales** editables y comparativa visual contra los totales reales (kcal, proteínas, carbos, azúcares, grasas, fibra).
- Guardado y carga de planes con nombre para reutilizarlos.

### Lista de la compra
- Selección de los días para los que comprar.
- Cálculo automático a partir del plan, agregando ingredientes y escalando cantidades por receta y número de personas.
- Marcado de elementos comprados con tachado y opacidad reducida.

### Autenticación y datos
- Cuentas pre-creadas mediante un script de *seed* (email + contraseña), con contraseñas hasheadas con **bcryptjs** y sesiones por **JWT**.
- Persistencia por usuario en **SQLite** (`better-sqlite3`).
- API REST bajo `/api/*` (auth, recipes, groups, menu, plans, nutrition-goals, shopping-list).

### Modo invitado
- La app es totalmente usable sin cuenta: las recetas, categorías, menú, plan y objetivos se guardan en `localStorage`.
- Al iniciar sesión la sesión cambia a la cuenta y la caché se limpia para no mezclar datos.

### Internacionalización
- Idioma por defecto **español**, con conmutador **ES/EN** en la barra de navegación y en la pantalla de inicio de sesión.
- La preferencia de idioma se guarda por navegador y actualiza también el atributo `lang` del documento.

### Diseño
- Sistema de tokens **ATMOS** y tema *Ethereal Sky Gradient* como diseño inicial, extraídos de https://styles.refero.design/. Se cambiará el diseño a futuro para incluir un sistema de diseñor propio.
  

## Stack técnico

- **Frontend**: React 18 + TypeScript + Vite + Tailwind v4 + Zustand + dnd-kit + TanStack Query + Lucide.
- **Backend**: Node.js + Express + TypeScript + better-sqlite3 + bcryptjs + jsonwebtoken + zod.
- **Monorepo**: el código de la aplicación vive en [`la-recetaria/`](la-recetaria/) (workspaces npm `frontend/`, `backend/`).

## Requisitos

- Node.js 20 o superior (este repo se desarrolló con v24).
- npm 10 o superior.
- Git.

## Desarrollo

En la raíz del repositorio, entra en la carpeta del monorepo e instala dependencias:

```bash
cd la-recetaria
npm install
npm run dev
```

Otros scripts útiles (desde `la-recetaria/`): `npm run build`, `npm run typecheck`, `npm run seed:users`, `npm run seed:sample-recipes`.
