-- =============================================================================
-- 02_sp_destinos.sql  -  Los 5 Stored Procedures CRUD de Tbl_Destinos
--
-- Convención: funciones PL/pgSQL con parámetros OUT
--     p_codigo  INTEGER  -> 200 ok | 201 creado | 400 datos inválidos
--                           404 no existe | 409 duplicado/relacionado | 500 error
--     p_mensaje VARCHAR  -> mensaje para el usuario
--     p_datos   JSON     -> registro(s) o NULL
-- NestJS las llama con:  SELECT * FROM sp_destinos_xxx($1, $2, ...)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: convierte una fila de Tbl_Destinos a JSON con las llaves del API
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_destino_a_json(d Tbl_Destinos)
RETURNS JSON
LANGUAGE sql IMMUTABLE
AS $$
    SELECT json_build_object(
        'codigoDestino',       d.CodigoDestino,
        'nombreDestino',       d.NombreDestino,
        'ciudad',              d.Ciudad,
        'pais',                d.Pais,
        'continente',          d.Continente,
        'descripcion',         d.Descripcion,
        'clima',               d.Clima,
        'moneda',              d.Moneda,
        'idiomaPrincipal',     d.IdiomaPrincipal,
        'requiereVisa',        d.RequiereVisa,
        'costoPromedioDiario', d.CostoPromedioDiario,
        'fechaRegistro',       to_char(d.FechaRegistro, 'YYYY-MM-DD'),
        'estado',              d.Estado
    );
$$;

-- -----------------------------------------------------------------------------
-- Helper: validaciones comunes de agregar / editar (lanza SQLSTATE 22023)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_destinos_validar(
    p_nombre_destino        VARCHAR,
    p_ciudad                VARCHAR,
    p_pais                  VARCHAR,
    p_continente            VARCHAR,
    p_moneda                VARCHAR,
    p_idioma_principal      VARCHAR,
    p_requiere_visa         SMALLINT,
    p_costo_promedio_diario NUMERIC,
    p_estado                SMALLINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_nombre_destino IS NULL OR btrim(p_nombre_destino) = '' THEN
        RAISE EXCEPTION 'El nombre del destino es obligatorio.' USING ERRCODE = '22023';
    END IF;
    IF p_ciudad IS NULL OR btrim(p_ciudad) = '' THEN
        RAISE EXCEPTION 'La ciudad es obligatoria.' USING ERRCODE = '22023';
    END IF;
    IF p_pais IS NULL OR btrim(p_pais) = '' THEN
        RAISE EXCEPTION 'El país es obligatorio.' USING ERRCODE = '22023';
    END IF;
    IF p_continente IS NULL OR btrim(p_continente) = '' THEN
        RAISE EXCEPTION 'El continente es obligatorio.' USING ERRCODE = '22023';
    END IF;
    IF p_moneda IS NULL OR btrim(p_moneda) = '' THEN
        RAISE EXCEPTION 'La moneda es obligatoria.' USING ERRCODE = '22023';
    END IF;
    IF p_idioma_principal IS NULL OR btrim(p_idioma_principal) = '' THEN
        RAISE EXCEPTION 'El idioma principal es obligatorio.' USING ERRCODE = '22023';
    END IF;
    IF p_requiere_visa IS NULL OR p_requiere_visa NOT IN (0,1) THEN
        RAISE EXCEPTION 'RequiereVisa debe ser 0 (no) o 1 (sí).' USING ERRCODE = '22023';
    END IF;
    IF p_costo_promedio_diario IS NULL OR p_costo_promedio_diario < 0 THEN
        RAISE EXCEPTION 'El costo promedio diario debe ser mayor o igual a cero.' USING ERRCODE = '22023';
    END IF;
    IF p_estado IS NULL OR p_estado NOT IN (0,1) THEN
        RAISE EXCEPTION 'El estado debe ser 0 (inactivo) o 1 (activo).' USING ERRCODE = '22023';
    END IF;
END;
$$;

-- =============================================================================
-- 1) CONSULTAR - Lista todos los destinos
-- =============================================================================
CREATE OR REPLACE FUNCTION sp_destinos_consultar(
    OUT p_codigo  INTEGER,
    OUT p_mensaje VARCHAR,
    OUT p_datos   JSON
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total INTEGER;
BEGIN
    BEGIN
        SELECT COUNT(*),
               COALESCE(json_agg(fn_destino_a_json(d) ORDER BY d.CodigoDestino), '[]'::json)
          INTO v_total, p_datos
          FROM Tbl_Destinos d;

        p_codigo := 200;
        IF v_total = 0 THEN
            p_mensaje := 'Consulta realizada con éxito. No hay destinos registrados.';
        ELSE
            p_mensaje := format('Consulta realizada con éxito. Se encontraron %s destino(s).', v_total);
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            p_codigo  := 500;
            p_mensaje := 'Error interno al consultar los destinos: ' || SQLERRM;
            p_datos   := NULL;
    END;
END;
$$;

-- =============================================================================
-- 2) BUSCAR - Obtiene un destino por su código
-- =============================================================================
CREATE OR REPLACE FUNCTION sp_destinos_buscar(
    p_codigo_destino INTEGER,
    OUT p_codigo     INTEGER,
    OUT p_mensaje    VARCHAR,
    OUT p_datos      JSON
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_destino Tbl_Destinos%ROWTYPE;
BEGIN
    BEGIN
        IF p_codigo_destino IS NULL OR p_codigo_destino <= 0 THEN
            RAISE EXCEPTION 'El código del destino debe ser un número entero mayor a cero.'
                USING ERRCODE = '22023';
        END IF;

        SELECT * INTO v_destino FROM Tbl_Destinos WHERE CodigoDestino = p_codigo_destino;

        IF NOT FOUND THEN
            p_codigo  := 404;
            p_mensaje := format('El destino con el código %s no existe.', p_codigo_destino);
            p_datos   := NULL;
            RETURN;
        END IF;

        p_codigo  := 200;
        p_mensaje := 'Destino encontrado con éxito.';
        p_datos   := fn_destino_a_json(v_destino);
    EXCEPTION
        WHEN invalid_parameter_value THEN
            p_codigo  := 400;
            p_mensaje := SQLERRM;
            p_datos   := NULL;
        WHEN OTHERS THEN
            p_codigo  := 500;
            p_mensaje := 'Error interno al buscar el destino: ' || SQLERRM;
            p_datos   := NULL;
    END;
END;
$$;

-- =============================================================================
-- 3) AGREGAR - Inserta un nuevo destino
-- =============================================================================
CREATE OR REPLACE FUNCTION sp_destinos_agregar(
    p_nombre_destino        VARCHAR,
    p_ciudad                VARCHAR,
    p_pais                  VARCHAR,
    p_continente            VARCHAR,
    p_descripcion           VARCHAR,
    p_clima                 VARCHAR,
    p_moneda                VARCHAR,
    p_idioma_principal      VARCHAR,
    p_requiere_visa         SMALLINT,
    p_costo_promedio_diario NUMERIC,
    p_estado                SMALLINT DEFAULT 1,
    OUT p_codigo            INTEGER,
    OUT p_mensaje           VARCHAR,
    OUT p_datos             JSON
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_destino Tbl_Destinos%ROWTYPE;
BEGIN
    BEGIN
        PERFORM fn_destinos_validar(
            p_nombre_destino, p_ciudad, p_pais, p_continente, p_moneda,
            p_idioma_principal, p_requiere_visa, p_costo_promedio_diario,
            COALESCE(p_estado, 1::SMALLINT)
        );

        INSERT INTO Tbl_Destinos (
            NombreDestino, Ciudad, Pais, Continente, Descripcion, Clima,
            Moneda, IdiomaPrincipal, RequiereVisa, CostoPromedioDiario, Estado
        ) VALUES (
            btrim(p_nombre_destino), btrim(p_ciudad), btrim(p_pais), btrim(p_continente),
            NULLIF(btrim(p_descripcion), ''), NULLIF(btrim(p_clima), ''),
            btrim(p_moneda), btrim(p_idioma_principal), p_requiere_visa,
            p_costo_promedio_diario, COALESCE(p_estado, 1::SMALLINT)
        )
        RETURNING * INTO v_destino;

        p_codigo  := 201;
        p_mensaje := 'Destino agregado exitosamente.';
        p_datos   := fn_destino_a_json(v_destino);
    EXCEPTION
        WHEN invalid_parameter_value THEN
            p_codigo  := 400;
            p_mensaje := SQLERRM;
            p_datos   := NULL;
        WHEN unique_violation THEN
            p_codigo  := 409;
            p_mensaje := 'Ya existe un destino registrado con el mismo nombre, ciudad y país.';
            p_datos   := NULL;
        WHEN check_violation OR not_null_violation OR string_data_right_truncation
             OR numeric_value_out_of_range THEN
            p_codigo  := 400;
            p_mensaje := 'Los datos enviados no cumplen las reglas de la tabla: ' || SQLERRM;
            p_datos   := NULL;
        WHEN OTHERS THEN
            p_codigo  := 500;
            p_mensaje := 'Error interno al agregar el destino: ' || SQLERRM;
            p_datos   := NULL;
    END;
END;
$$;

-- =============================================================================
-- 4) EDITAR - Actualiza un destino existente
-- =============================================================================
CREATE OR REPLACE FUNCTION sp_destinos_editar(
    p_codigo_destino        INTEGER,
    p_nombre_destino        VARCHAR,
    p_ciudad                VARCHAR,
    p_pais                  VARCHAR,
    p_continente            VARCHAR,
    p_descripcion           VARCHAR,
    p_clima                 VARCHAR,
    p_moneda                VARCHAR,
    p_idioma_principal      VARCHAR,
    p_requiere_visa         SMALLINT,
    p_costo_promedio_diario NUMERIC,
    p_estado                SMALLINT,
    OUT p_codigo            INTEGER,
    OUT p_mensaje           VARCHAR,
    OUT p_datos             JSON
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_destino Tbl_Destinos%ROWTYPE;
BEGIN
    BEGIN
        IF p_codigo_destino IS NULL OR p_codigo_destino <= 0 THEN
            RAISE EXCEPTION 'El código del destino debe ser un número entero mayor a cero.'
                USING ERRCODE = '22023';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM Tbl_Destinos WHERE CodigoDestino = p_codigo_destino) THEN
            p_codigo  := 404;
            p_mensaje := format('El destino con el código %s no existe, no se puede editar.', p_codigo_destino);
            p_datos   := NULL;
            RETURN;
        END IF;

        PERFORM fn_destinos_validar(
            p_nombre_destino, p_ciudad, p_pais, p_continente, p_moneda,
            p_idioma_principal, p_requiere_visa, p_costo_promedio_diario, p_estado
        );

        UPDATE Tbl_Destinos
           SET NombreDestino       = btrim(p_nombre_destino),
               Ciudad              = btrim(p_ciudad),
               Pais                = btrim(p_pais),
               Continente          = btrim(p_continente),
               Descripcion         = NULLIF(btrim(p_descripcion), ''),
               Clima               = NULLIF(btrim(p_clima), ''),
               Moneda              = btrim(p_moneda),
               IdiomaPrincipal     = btrim(p_idioma_principal),
               RequiereVisa        = p_requiere_visa,
               CostoPromedioDiario = p_costo_promedio_diario,
               Estado              = p_estado
         WHERE CodigoDestino = p_codigo_destino
        RETURNING * INTO v_destino;

        p_codigo  := 200;
        p_mensaje := 'Destino actualizado exitosamente.';
        p_datos   := fn_destino_a_json(v_destino);
    EXCEPTION
        WHEN invalid_parameter_value THEN
            p_codigo  := 400;
            p_mensaje := SQLERRM;
            p_datos   := NULL;
        WHEN unique_violation THEN
            p_codigo  := 409;
            p_mensaje := 'Ya existe otro destino con el mismo nombre, ciudad y país.';
            p_datos   := NULL;
        WHEN check_violation OR not_null_violation OR string_data_right_truncation
             OR numeric_value_out_of_range THEN
            p_codigo  := 400;
            p_mensaje := 'Los datos enviados no cumplen las reglas de la tabla: ' || SQLERRM;
            p_datos   := NULL;
        WHEN OTHERS THEN
            p_codigo  := 500;
            p_mensaje := 'Error interno al editar el destino: ' || SQLERRM;
            p_datos   := NULL;
    END;
END;
$$;

-- =============================================================================
-- 5) ELIMINAR - Elimina un destino (si no tiene registros relacionados)
-- =============================================================================
CREATE OR REPLACE FUNCTION sp_destinos_eliminar(
    p_codigo_destino INTEGER,
    OUT p_codigo     INTEGER,
    OUT p_mensaje    VARCHAR,
    OUT p_datos      JSON
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_destino Tbl_Destinos%ROWTYPE;
BEGIN
    BEGIN
        IF p_codigo_destino IS NULL OR p_codigo_destino <= 0 THEN
            RAISE EXCEPTION 'El código del destino debe ser un número entero mayor a cero.'
                USING ERRCODE = '22023';
        END IF;

        DELETE FROM Tbl_Destinos
         WHERE CodigoDestino = p_codigo_destino
        RETURNING * INTO v_destino;

        IF NOT FOUND THEN
            p_codigo  := 404;
            p_mensaje := format('El destino con el código %s no existe, no se puede eliminar.', p_codigo_destino);
            p_datos   := NULL;
            RETURN;
        END IF;

        p_codigo  := 200;
        p_mensaje := 'Destino eliminado exitosamente.';
        p_datos   := fn_destino_a_json(v_destino);
    EXCEPTION
        WHEN invalid_parameter_value THEN
            p_codigo  := 400;
            p_mensaje := SQLERRM;
            p_datos   := NULL;
        WHEN foreign_key_violation THEN
            p_codigo  := 409;
            p_mensaje := format('No se puede eliminar el destino %s porque tiene registros relacionados (hoteles, paquetes, transportes o itinerarios).', p_codigo_destino);
            p_datos   := NULL;
        WHEN OTHERS THEN
            p_codigo  := 500;
            p_mensaje := 'Error interno al eliminar el destino: ' || SQLERRM;
            p_datos   := NULL;
    END;
END;
$$;
