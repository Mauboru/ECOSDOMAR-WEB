
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  instituicao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, instituicao)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'instituicao', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.carcinofauna (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  pesquisador text NOT NULL,
  local_pesquisa text NOT NULL,
  ambiente text NOT NULL,
  data_coleta date NOT NULL,
  hora_inicio time NOT NULL,
  hora_termino time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  especie text,
  nomenclatura text,
  descricao text,
  origem text,
  quantidade integer,
  tamanho_toca_cm numeric
);

CREATE TABLE public.qualidade_agua (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  pesquisador text NOT NULL,
  local_pesquisa text NOT NULL,
  ambiente text NOT NULL,
  data_coleta date NOT NULL,
  hora_inicio time NOT NULL,
  hora_termino time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  classe_conama text,
  condicoes_climaticas text,
  temperatura_agua numeric,
  turbidez numeric,
  ph numeric,
  salinidade numeric,
  nitrito numeric,
  amonia numeric,
  oxigenio_dissolvido numeric
);

CREATE TABLE public.avifauna (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  pesquisador text NOT NULL,
  local_pesquisa text NOT NULL,
  ambiente text NOT NULL,
  data_coleta date NOT NULL,
  hora_inicio time NOT NULL,
  hora_termino time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  especie text,
  nomenclatura text,
  descricao text,
  quantidade integer,
  vivos integer,
  mortos integer
);

CREATE TABLE public.especies_exoticas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  pesquisador text NOT NULL,
  local_pesquisa text NOT NULL,
  ambiente text NOT NULL,
  data_coleta date NOT NULL,
  hora_inicio time NOT NULL,
  hora_termino time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  especie text,
  nomenclatura text,
  descricao text,
  quantidade integer
);

CREATE TABLE public.macrolixo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  pesquisador text NOT NULL,
  local_pesquisa text NOT NULL,
  ambiente text NOT NULL,
  data_coleta date NOT NULL,
  hora_inicio time NOT NULL,
  hora_termino time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  tipo text,
  quantidade integer
);

CREATE TABLE public.vegetacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  pesquisador text NOT NULL,
  local_pesquisa text NOT NULL,
  ambiente text NOT NULL,
  data_coleta date NOT NULL,
  hora_inicio time NOT NULL,
  hora_termino time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  tipo text,
  nomenclatura text,
  descricao text,
  quantidade integer
);

CREATE TABLE public.peixes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  pesquisador text NOT NULL,
  local_pesquisa text NOT NULL,
  ambiente text NOT NULL,
  data_coleta date NOT NULL,
  hora_inicio time NOT NULL,
  hora_termino time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  especie text,
  nomenclatura text,
  descricao text,
  tamanho_cm numeric,
  quantidade integer
);

CREATE TABLE public.paisagem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  pesquisador text NOT NULL,
  local_pesquisa text NOT NULL,
  ambiente text NOT NULL,
  data_coleta date NOT NULL,
  hora_inicio time NOT NULL,
  hora_termino time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  caracteristicas text,
  quantidade integer
);

CREATE TABLE public.ar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  pesquisador text NOT NULL,
  local_pesquisa text NOT NULL,
  ambiente text NOT NULL,
  data_coleta date NOT NULL,
  hora_inicio time NOT NULL,
  hora_termino time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  observacoes text
);

CREATE TABLE public.restinga (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  pesquisador text NOT NULL,
  local_pesquisa text NOT NULL,
  ambiente text NOT NULL,
  data_coleta date NOT NULL,
  hora_inicio time NOT NULL,
  hora_termino time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  tipo text,
  nomenclatura text,
  animal text,
  ecossistema text,
  residuos_encontrados text,
  quantidade integer,
  quantidade_residuos integer,
  tamanho_maior_cm numeric,
  tamanho_menor_cm numeric
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['carcinofauna','qualidade_agua','avifauna','especies_exoticas','macrolixo','vegetacao','peixes','paisagem','ar','restinga']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', t||'_select', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', t||'_insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t||'_update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)', t||'_delete', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t||'_updated_at', t);
    EXECUTE format('CREATE INDEX %I ON public.%I (data_coleta)', t||'_data_idx', t);
  END LOOP;
END $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
