# Portal de Objetos Perdidos Municipal

Sistema integral para la gestión de objetos perdidos y encontrados en ayuntamientos. Permite a los ciudadanos reportar pérdidas, buscar objetos encontrados y solicitar su recuperación. Los administradores municipales pueden gestionar el inventario, almacén, coincidencias y subastas.

## Stack Tecnológico

- **Backend**: Symfony 7.x + PHP 8.3
- **Frontend**: Angular 21
- **Base de datos**: PostgreSQL 16 / SQLite (desarrollo)
- **Autenticación**: JWT (LexikJWTAuthenticationBundle)
- **Almacenamiento**: S3-compatible (MinIO / AWS S3)
- **Contenedores**: Docker + Docker Compose

## Características

### Para Ciudadanos
- Búsqueda en galería de objetos encontrados
- Reporte de objetos perdidos
- Solicitud de recuperación de objetos
- Sistema de alertas personalizadas
- Participación en subastas públicas
- Seguimiento de solicitudes

### Para Administradores
- Registro rápido de objetos encontrados
- Gestión de almacén con ubicaciones jerárquicas
- Sistema de coincidencias automáticas
- Gestión de solicitudes de recuperación
- Creación de lotes para subasta/donación/reciclaje
- Panel de estadísticas
- Gestión de usuarios

## Estructura del Proyecto

```
objetos-perdidos/
├── backend/                 # API REST Symfony
│   ├── src/
│   │   ├── Controller/      # Controladores API
│   │   ├── Entity/          # Entidades Doctrine
│   │   ├── Repository/      # Repositorios
│   │   └── Service/         # Servicios de negocio
│   └── config/
├── frontend/                # Aplicación Angular
│   └── src/app/
│       ├── core/            # Servicios, guards, interceptors
│       ├── shared/          # Componentes reutilizables
│       ├── features/        # Módulos por funcionalidad
│       └── layouts/
└── docker/                  # Configuración Docker
```

## Instalación

### Requisitos
- PHP 8.3+
- Composer
- Node.js 20+
- npm o yarn

### Backend

```bash
cd backend

# Instalar dependencias
composer install

# Configurar variables de entorno
cp .env .env.local
# Editar .env.local con tus configuraciones

# Generar claves JWT
mkdir -p config/jwt
openssl genpkey -out config/jwt/private.pem -aes256 -algorithm rsa -pkeyopt rsa_keygen_bits:4096
openssl pkey -in config/jwt/private.pem -out config/jwt/public.pem -pubout

# Crear base de datos y schema
php bin/console doctrine:database:create
php bin/console doctrine:schema:create

# Iniciar servidor de desarrollo
php -S localhost:8088 -t public/
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
ng serve
```

La aplicación estará disponible en http://localhost:4200

### Docker (Alternativa)

```bash
docker-compose up -d
```

Servicios disponibles:
- Frontend: http://localhost:4200
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432
- MinIO: http://localhost:9000
- MailHog: http://localhost:8025

## Configuración

### Variables de Entorno (Backend)

```env
# Base de datos
DATABASE_URL="postgresql://user:pass@localhost:5432/objetos_perdidos"

# JWT
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=your-passphrase

# Almacenamiento S3
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minio_access_key
S3_SECRET_KEY=minio_secret_key
S3_BUCKET=objetos-perdidos

# Email
MAILER_DSN=smtp://localhost:1025
```

### Variables de Entorno (Frontend)

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8088/api'
};
```

## API Endpoints

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/register` | Registrar usuario |
| GET | `/api/auth/me` | Obtener usuario actual |

### Objetos (Público)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/objetos` | Listar objetos encontrados |
| GET | `/api/objetos/{id}` | Detalle de objeto |
| GET | `/api/categorias` | Listar categorías |

### Objetos (Usuario autenticado)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/objetos/perdidos` | Reportar objeto perdido |
| GET | `/api/mis-objetos` | Mis objetos reportados |
| POST | `/api/objetos/{id}/solicitar` | Solicitar recuperación |

### Admin
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/admin/objetos` | Registrar objeto encontrado |
| GET | `/api/admin/solicitudes` | Listar solicitudes |
| GET | `/api/admin/coincidencias` | Listar coincidencias |
| GET | `/api/admin/estadisticas/dashboard` | Estadísticas |

## Modelo de Datos

### Entidades Principales

- **Usuario**: Ciudadanos y administradores
- **Objeto**: Objetos perdidos y encontrados
- **Categoria**: Clasificación de objetos
- **Solicitud**: Solicitudes de recuperación
- **Coincidencia**: Matches entre perdidos y encontrados
- **Almacen/Ubicacion**: Gestión de almacenamiento
- **Lote/Subasta/Puja**: Sistema de subastas

## Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@test.com | test1234 | Admin Municipal |
| user@test.com | test1234 | Ciudadano |

## Licencia

Este proyecto está bajo la Licencia MIT.

## Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request
