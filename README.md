# Fiscalización de Residuos — MVP

Sistema de registro para inspectores de residuos peligrosos, patológicos y aceites vegetales usados (UVA).

---

## Stack

- **React 18 + Vite** — frontend SPA
- **Tailwind CSS 3** — estilos
- **Supabase** — PostgreSQL + Google OAuth
- **SheetJS (xlsx)** — exportación Excel
- **jsPDF + AutoTable** — exportación PDF

---

## Setup paso a paso

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

Copiar `.env.example` a `.env` y completar con los datos de tu proyecto Supabase:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Crear tablas en Supabase (SQL Editor)

```sql
CREATE TABLE inspectores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id  TEXT UNIQUE NOT NULL,
  nombre     TEXT NOT NULL,
  email      TEXT UNIQUE,
  rol        TEXT NOT NULL DEFAULT 'inspector' CHECK (rol IN ('inspector','admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE registros_fiscalizacion (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspector_id             UUID REFERENCES inspectores(id) NOT NULL,
  tipo_residuo             TEXT NOT NULL CHECK (tipo_residuo IN ('Peligroso','Patologico','UVA')),
  nombre_empresa           TEXT NOT NULL,
  direccion_empresa        TEXT NOT NULL,
  rubro_empresa            TEXT,
  volumen_retirado         NUMERIC,
  unidad_volumen           TEXT,
  numero_manifiesto_remito TEXT,
  fecha_retiro             DATE,
  observaciones            TEXT,
  fecha_hora_registro      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE registros_fiscalizacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_policy" ON registros_fiscalizacion
  FOR SELECT USING (
    inspector_id = (SELECT id FROM inspectores WHERE google_id = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM inspectores WHERE google_id = auth.uid()::text AND rol = 'admin')
  );

CREATE POLICY "insert_policy" ON registros_fiscalizacion
  FOR INSERT WITH CHECK (
    inspector_id = (SELECT id FROM inspectores WHERE google_id = auth.uid()::text)
  );
```

### 4. Configurar Google OAuth en Supabase

1. Dashboard Supabase → *Authentication → Providers → Google* → activar.
2. Copiar la **Callback URL** de Supabase.
3. En Google Cloud Console: *APIs & Services → Credentials → OAuth 2.0 Client ID (Web)*.
4. Pegar la callback URL en *Authorized redirect URIs*.
5. Copiar **Client ID** y **Client Secret** de vuelta en Supabase → Save.
6. En *Authentication → URL Configuration*: agregar `http://localhost:5173` en Site URL.

### 5. Primer admin

Después del primer login con tu cuenta:

```sql
UPDATE inspectores SET rol = 'admin' WHERE email = 'tu@email.com';
```

### 6. Correr en desarrollo

```bash
npm run dev
```

---

## Estructura

```
src/
├── components/
│   ├── LoginScreen.jsx        Login con Google
│   ├── WasteTypeSelector.jsx  Selección de tipo de residuo
│   ├── InspectionForm.jsx     Formulario de registro
│   ├── SuccessScreen.jsx      Confirmación
│   ├── AdminPanel.jsx         Panel admin: tabla + filtros + exportación
│   └── ExportButtons.jsx      CSV / Excel / PDF
├── hooks/useAuth.js            Sesión y perfil
├── lib/supabaseClient.js       Cliente Supabase
└── utils/exportUtils.js        Exportaciones
```

## Deploy

```bash
npm run build   # genera dist/
```

Subir `dist/` a Vercel o Netlify. Agregar la URL de producción en Supabase → Redirect URLs.
