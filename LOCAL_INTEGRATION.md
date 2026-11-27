# Integración LOCAL Unificada (`http://localhost:4200`)

Este documento define el mecanismo oficial para ejecutar **Employee Portal** y las aplicaciones corporativas integradas bajo un mismo origen local (`http://localhost:4200`), así como el estándar para incorporar nuevas aplicaciones.

---

## 1. Topología LOCAL Oficial

| URL Pública LOCAL | Aplicación | Proceso Interno |
| :--- | :--- | :--- |
| `http://localhost:4200/employee-portal/*` | Employee Portal UI | Angular Dev Server (`4200`) |
| `http://localhost:4200/employee-portal/api/*` | Employee Portal / IAM Backend | `http://localhost:8083` |
| `http://localhost:4200/employee-portal/oauth2/*` | Authorization Server (OIDC) | `http://localhost:8083` |
| `http://localhost:4200/employee-portal/connect/*` | OIDC Logout / UserInfo | `http://localhost:8083` |
| `http://localhost:4200/employee-portal/.well-known/*` | OIDC Discovery | `http://localhost:8083` |
| `http://localhost:4200/portal-cxp/*` | Portal CxP Integrado | `http://localhost:4201` |
| `http://localhost:4200/poliza-electronica/*` | Póliza Electrónica | `http://localhost:4206` |

---

## 2. Cómo levantar Employee Portal en LOCAL

El archivo versionado `proxy.conf.json` está asociado automáticamente a la configuración `development` en `angular.json` (`architect.serve.configurations.development.proxyConfig`).

Para levantar el portal local con todas las rutas integradas basta ejecutar:

```bash
npm start
```

(equivalente a `ng serve` o `npm run start:dev`). No requiere pasar `--proxy-config` manualmente ni depender de archivos externos.

> Los builds (`npm run build`, `npm run build:dev`, `npm run build:prod`) y la configuración `production` **no** utilizan `proxy.conf.json`.

---

## 3. Separación de Responsabilidades: LOCAL vs DEV / PROD

| Entorno | Mecanismo de Routing | Alcance |
| :--- | :--- | :--- |
| **LOCAL** | `employee-portal-ui/proxy.conf.json` (Angular Dev Server) | Exclusivo para desarrollo local en `http://localhost:4200`. |
| **DEV / PROD** | **IIS / ARR / URL Rewrite** | Routing en servidores. `proxy.conf.json` **NO** se usa en DEV ni en PROD. |

La topología pública se mantiene homogénea entre ambientes (`/employee-portal`, `/portal-cxp`, `/poliza-electronica`, `/<nueva-app>`), pero el enrutamiento en servidores corresponde a IIS/ARR/URL Rewrite.

### No duplicar configuración de negocio en `proxy.conf.json`

`proxy.conf.json` **no** es el catálogo maestro de aplicaciones; únicamente resuelve `context path -> proceso frontend local`. La configuración funcional permanece en su lugar oficial:

- **IAM (BD):** `applications`, `menus`, `oauth_clients`, `oauth_client_redirect_uris`.
- **Employee Portal Backend (`application-local.yml`):** `corporate.navigation.app-base-urls`.
- **Cada aplicación frontend:** `applicationCode`, `clientId`, `issuer`, `base-href` y `environment*.ts`.

---

## 4. Estándar para Incorporar una Nueva Aplicación

Ejemplo para incorporar una nueva aplicación **`NUEVA_APP`**:

- `applicationCode`: `NUEVA_APP`
- Frontend interno local: `http://localhost:4210`
- Context path: `nueva-app`
- URL pública local resultante: `http://localhost:4200/nueva-app/`

### Paso 1 — Proxy LOCAL (`employee-portal-ui/proxy.conf.json`)

Agregar la entrada de routing local:

```json
"/nueva-app": {
  "target": "http://localhost:4210",
  "secure": false,
  "changeOrigin": false,
  "ws": true,
  "logLevel": "info"
}
```

### Paso 2 — SPA Angular de la nueva aplicación

- Compilar/servir con `base-href=/nueva-app/` (con fallback SPA a `index.html` para rutas internas).
- Configurar en su `environment.ts` local:
  - `applicationCode: 'NUEVA_APP'`
  - `oidcIssuer: 'http://localhost:8083/employee-portal'`
  - `employeePortalUrl: 'http://localhost:4200/employee-portal'`
- Verificar que el namespace de `sessionStorage` generado por `@rassini/rassini-ui` sea:
  - `rassini_NUEVA_APP_*`

### Paso 3 — Registro en IAM LOCAL (`localhost:3307/iam`)

- Aplicación: `NUEVA_APP`
- OAuth Client: `nueva-app-client`
- `REDIRECT` URI local: `http://localhost:4200/nueva-app/callback`
- `POST_LOGOUT` URI local: `http://localhost:4200/nueva-app/logout`

### Paso 4 — Navegación en Employee Portal Backend (`application-local.yml`)

Registrar la URL base en `corporate.navigation.app-base-urls`:

```yaml
corporate:
  navigation:
    app-base-urls:
      NUEVA_APP: ${NUEVA_APP_BASE_URL:http://localhost:4200/nueva-app}
```

### Paso 5 — Validación LOCAL

1. Levantar la nueva app en `localhost:4210` bajo `/nueva-app/`.
2. Reiniciar `employee-portal` (`8083`) y `employee-portal-ui` (`npm start`).
3. Verificar `200 OK` en `http://localhost:4200/nueva-app/` y navegación SSO desde Employee Portal sin segundo login.
