# Guía de Contribución - Satoshi Dashboard

¡Gracias por tu interés en contribuir a Satoshi Dashboard! Somos una comunidad abierta y valoramos todas las contribuciones, ya sean código, documentación, reportes de bugs o ideas.

## Cómo Empezar

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Git
- Conocimiento básico de React y Express (para cambios técnicos)

### Configuración del Entorno Local

1. **Fork del repositorio**
   ```bash
   git clone https://github.com/tu-usuario/satoshi-dashboard.git
   cd satoshi-dashboard
   ```

2. **Instala dependencias**
   ```bash
   npm install
   ```

3. **Configura variables de entorno**
   ```bash
   cp .env.example .env.local
   # Completa con tus valores (consulta la documentación de entorno)
   ```

4. **Inicia el desarrollo**
   ```bash
   npm run dev
   ```

El proyecto se ejecutará en `http://localhost:5173` (UI) y `http://localhost:3000` (API).

## Tipos de Contribución

### 🐛 Reportar Bugs
- Verifica que no exista un issue similar
- Usa el template de bug report
- Incluye pasos para reproducir
- Especifica tu entorno (OS, navegador, versión de Node)
- Adjunta capturas o videos si es relevante

### ✨ Nuevas Características
- Abre una **Discussion** o **Issue** para proponer la idea
- Espera feedback de los mantenedores
- Una vez aprobado, crea un PR con la implementación

### 📚 Documentación
- Mejora archivos README o guías existentes
- Documenta nuevas características
- Corrige errores tipográficos o de claridad
- Traduce contenido a otros idiomas

### 🔍 Code Review
- Revisa PRs pendientes
- Proporciona feedback constructivo
- Ayuda a identificar problemas potenciales

## Flujo de Trabajo

### 1. Crea una rama
```bash
# Para features
git checkout -b feature/descripcion-corta

# Para bugs
git checkout -b bugfix/descripcion-corta
```

### 2. Realiza cambios
- Mantén cambios enfocados y atómicos
- Sigue la guía de estilo del proyecto
- Ejecuta linter: `npm run lint`
- Prueba localmente: `npm run dev`

### 3. Commits claros
```bash
# Usa mensajes descriptivos
git commit -m "feat: agregar módulo de Lightning Network"
git commit -m "fix: corregir cálculo de volatilidad"
git commit -m "docs: actualizar guía de instalación"
```

### 4. Push y Pull Request
```bash
git push origin feature/tu-feature
```

- Completa el template de PR
- Vincula issues relacionados con `closes #123`
- Espera review de los mantenedores

## Estándares de Código

### Frontend (React/Tailwind)
- Componentes funcionales con hooks
- Props tipadas cuando sea posible
- Nombres descriptivos para variables y funciones
- Máximo 300 líneas por componente
- Usa Tailwind para estilos (no CSS adicional sin justificación)

### Backend (Express/Node)
- Endpoints consistentes con `/api/*`
- Validación de entrada en todas las rutas
- Manejo de errores apropiado
- Logging claro para debugging
- Comentarios para lógica compleja

### General
```bash
# Lint y correcciones automáticas
npm run lint -- --fix

# Build de validación
npm run build

# Verificación de seguridad
npm run check:security
```

## Ramas de Trabajo

- **main** - Código estable en producción
- **develop** - Rama de integración (si existe)
- **feature/*** - Nuevas características
- **bugfix/*** - Correcciones de bugs
- **docs/*** - Cambios de documentación

## Testing

No hay suite de tests requerida actualmente, pero:
- Prueba manualmente en `npm run dev`
- Verifica que el lint pase
- Confirma que `npm run build` sea exitoso
- Valida en múltiples navegadores si afecta UI

## Revisión de Código

Todos los PRs requieren al menos 1 aprobación. Los revisores buscan:
- ✅ Código limpio y mantenible
- ✅ Cambios enfocados en el objetivo
- ✅ Documentación actualizada si aplica
- ✅ Sin regresiones de seguridad
- ✅ Consistencia con el estilo del proyecto

## Comunicación

- **Issues** - Reporta bugs, propone features, discute problemas técnicos
- **Discussions** - Conversaciones abiertas, ideas, preguntas
- **Pull Requests** - Implementación de cambios

Se espera comunicación respetuosa, constructiva y transparente.

## Reconocimiento

- Todos los contribuidores serán mencionados en el README
- Contribuciones significativas pueden ser destacadas en releases
- Valoramos la participación consistente en la comunidad

## Código de Conducta

Este proyecto adhiere a un Código de Conducta (ver `CODE_OF_CONDUCT.md`). Al participar, aceptas mantener un ambiente inclusivo, respetuoso y profesional.

## Preguntas

- Abre una **Discussion** para dudas generales
- Revisa la documentación en `.claude/` (guías internas)
- Contacta a los mantenedores si necesitas aclaraciones

---

**¡Gracias por contribuir a Satoshi Dashboard!** 🚀
