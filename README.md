# Employee Portal UI

Portal corporativo de administración de empleados de Rassini.

## Descripción

Employee Portal UI es la aplicación frontend desarrollada en Angular para la administración de usuarios, roles, permisos, menús y acceso a aplicaciones corporativas.

La aplicación consume los servicios expuestos por Employee Portal Backend y utiliza la librería corporativa `@rassini/rassini-ui` para reutilizar componentes, layouts, autenticación y servicios compartidos.

---

# Arquitectura

```text
employee-portal-ui
        │
        ▼
@rassini/rassini-ui
        │
        ▼
employee-portal (Spring Boot)
        │
        ▼
MySQL
```

---

# Tecnologías

- Angular 21
- TypeScript
- PrimeNG 21
- SCSS
- RxJS
- @rassini/rassini-ui

---

# Backend asociado

Proyecto:

```text
employee-portal
```

Base URL:

```text
http://localhost:8080/api/v1
```

---

# Autenticación

La aplicación utiliza JWT.

Endpoints:

```http
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/refresh
POST /api/v1/auth/reset-password
```

La autenticación, restauración de sesión, guards e interceptors son proporcionados por:

```text
@rassini/rassini-ui
```

---

# Módulos

## Dashboard

Pantalla principal del portal.

## Usuarios

Administración de usuarios.

Funciones:

- Consultar usuarios
- Crear usuarios
- Editar usuarios
- Eliminar usuarios
- Asignar roles

## Roles

Administración de roles.

## Permisos

Administración de permisos.

## Menús

Administración de menús dinámicos.

---

# Estructura del proyecto

```text
src/
└── app/
    ├── features/
    │   ├── dashboard/
    │   ├── usuarios/
    │   ├── roles/
    │   ├── permisos/
    │   └── menus/
    │
    ├── layout/
    │
    ├── pages/
    │   └── auth/
    │
    └── shared/
```

---

# Dependencias Corporativas

La aplicación consume:

```json
{
  "@rassini/rassini-ui": "file:../sakai-ng/dist/rassini-ui/rassini-rassini-ui-0.0.1.tgz"
}
```

La librería proporciona:

- Login corporativo
- Guards
- Interceptors
- Manejo de sesión
- Layout corporativo
- Toasts
- Confirm dialogs
- Loaders
- Componentes reutilizables

La lógica de negocio permanece en Employee Portal UI.

---

# Instalación

Instalar dependencias:

```bash
npm install
```

---

# Ejecución local

```bash
ng serve
```

Aplicación:

```text
http://localhost:4200
```

---

# Compilación

```bash
ng build
```

Salida:

```text
dist/employee-portal-ui
```

---

# Requisitos

Backend ejecutándose:

```text
http://localhost:8080
```

Base de datos MySQL disponible.

Variables de entorno configuradas para Employee Portal Backend.

---

# Convenciones

- No duplicar lógica existente en `@rassini/rassini-ui`.
- Toda autenticación debe consumir la librería corporativa.
- Toda lógica de negocio debe permanecer en Employee Portal UI.
- Los menús deben provenir del backend.
- No utilizar datos mock en ambientes funcionales.

---

# Estado del Proyecto

✅ Integración con Employee Portal Backend

✅ Integración con @rassini/rassini-ui

✅ Autenticación JWT

✅ Menú dinámico basado en permisos

✅ Arquitectura desacoplada de la librería

🚧 Evolución continua