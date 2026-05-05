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
- Marcado de elementos comprados con tachado y opacado.

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
- Sistema de tokens **ATMOS** y tema *Ethereal Sky Gradient* (ver [`../DESIGN.md`](../DESIGN.md)).
- Tarjetas de receta responsivas (alturas e imagen escalan por *breakpoint*), modales adaptativos y barra superior con desplazamiento horizontal en móvil.

## Stack técnico

- **Frontend**: React 18 + TypeScript + Vite + Tailwind v4 + Zustand + dnd-kit + TanStack Query + Lucide.
- **Backend**: Node.js + Express + TypeScript + better-sqlite3 + bcryptjs + jsonwebtoken + zod.
- **Monorepo**: workspaces de npm (`frontend/`, `backend/`).

## Requisitos

- Node.js 20 o superior (este repo se desarrolló con v24).
- npm 10 o superior.
- Git.

## Primera instalación

```powershell
# desde esta carpeta
npm install
```

Esto instala los workspaces `frontend/` y `backend/` de una sola vez.

A continuación, crea el archivo de usuarios *seed*:

```powershell
Copy-Item backend\users.example.json backend\users.local.json
# edita backend\users.local.json con tu email y contraseña
npm run seed:users
```

`users.local.json` está en `.gitignore`. Vuelve a ejecutar `npm run seed:users` cuando quieras añadir un usuario o rotar una contraseña.

### Recetas de ejemplo (para pruebas)

Cuando exista al menos un usuario, carga 10 recetas de ejemplo asociadas al **primer usuario** de la base de datos (o al `SEED_USER_ID` que indiques):

```powershell
npm run seed:sample-recipes
```

Las recetas se definen en `backend/data/sample-recipes.json`. El script **omite** cualquier receta cuyo nombre ya exista para ese usuario, así que puede ejecutarse varias veces sin duplicar datos.

## Desarrollo local

```powershell
npm run dev
```

Levanta:

- Backend en <http://localhost:4000> (Express + SQLite).
- Frontend en <http://localhost:5173> (Vite con HMR).

El frontend hace *proxy* de `/api/*` al backend. La app también puede usarse sin iniciar sesión en **modo invitado**: los datos se guardan solo en tu navegador y nunca salen de él.

## Estructura del proyecto

```
la-recetaria/
  package.json        # raíz de los workspaces
  backend/            # API Express + SQLite
  frontend/           # App React + Vite
```

## Forma del JSON de receta

Cuando subes una receta (o la creas vía API) tiene esta forma:

```ts
{
  name: string;
  imageUrl?: string;
  prepTimeMin: number;
  baseServings: number;            // las cantidades de los ingredientes son para este nº de raciones
  tags: string[];                  // libres: "desayuno", "proteína", "congelable", ...
  ingredients: { name: string; quantity: number; unit: string }[];
  kcal: number;                    // por baseServings
  nutrition: { protein: number; carbs: number; sugars: number; fat: number; fiber: number };
  steps: string[];
  videoUrl?: string;
}
```

El frontend reescala `quantity`, `kcal` y `nutrition` proporcionalmente al número de personas seleccionado en cada receta o ranura del plan.

## Privacidad y reglas operativas

Consulta [`../AGENTS.md`](../AGENTS.md) para la frontera de privacidad que aplica a los agentes de IA en este workspace.
