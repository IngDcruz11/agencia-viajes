-- =============================================================================
-- 03_sp_auth.sql  -  Stored Procedures de autenticación
--   Access Token  -> JWT firmado por NestJS (vida corta, ej. 5 min)
--   Refresh Token -> cadena aleatoria generada por NestJS; aquí se guarda
--                    SOLO su hash SHA-256 y su fecha de expiración.
--                    Se rota en cada refresh (el anterior deja de servir).
-- Misma convención de salida: p_codigo, p_mensaje, p_datos
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_hash_token(p_token VARCHAR)
RETURNS VARCHAR
LANGUAGE sql IMMUTABLE
AS $$
    SELECT encode(digest(p_token, 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION fn_usuario_a_json(u Tbl_Usuarios)
RETURNS JSON
LANGUAGE sql IMMUTABLE
AS $$
    SELECT json_build_object(
        'codigoUsuario',  u.CodigoUsuario,
        'nombreUsuario',  u.NombreUsuario,
        'nombreCompleto', u.NombreCompleto,
        'rol',            u.Rol
    );
$$;

-- =============================================================================
-- REGISTRAR usuario
-- =============================================================================
CREATE OR REPLACE FUNCTION sp_usuarios_registrar(
    p_nombre_usuario  VARCHAR,
    p_contrasena      VARCHAR,
    p_nombre_completo VARCHAR,
    OUT p_codigo      INTEGER,
    OUT p_mensaje     VARCHAR,
    OUT p_datos       JSON
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_usuario Tbl_Usuarios%ROWTYPE;
BEGIN
    BEGIN
        IF p_nombre_usuario IS NULL OR length(btrim(p_nombre_usuario)) < 3 THEN
            RAISE EXCEPTION 'El nombre de usuario debe tener al menos 3 caracteres.' USING ERRCODE = '22023';
        END IF;
        IF p_contrasena IS NULL OR length(p_contrasena) < 6 THEN
            RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres.' USING ERRCODE = '22023';
        END IF;
        IF p_nombre_completo IS NULL OR btrim(p_nombre_completo) = '' THEN
            RAISE EXCEPTION 'El nombre completo es obligatorio.' USING ERRCODE = '22023';
        END IF;

        INSERT INTO Tbl_Usuarios (NombreUsuario, Contrasena, NombreCompleto)
        VALUES (lower(btrim(p_nombre_usuario)), crypt(p_contrasena, gen_salt('bf')), btrim(p_nombre_completo))
        RETURNING * INTO v_usuario;

        p_codigo  := 201;
        p_mensaje := 'Usuario registrado exitosamente.';
        p_datos   := fn_usuario_a_json(v_usuario);
    EXCEPTION
        WHEN invalid_parameter_value THEN
            p_codigo := 400; p_mensaje := SQLERRM; p_datos := NULL;
        WHEN unique_violation THEN
            p_codigo := 409; p_mensaje := 'El nombre de usuario ya está registrado.'; p_datos := NULL;
        WHEN OTHERS THEN
            p_codigo := 500; p_mensaje := 'Error interno al registrar el usuario: ' || SQLERRM; p_datos := NULL;
    END;
END;
$$;

-- =============================================================================
-- LOGIN: valida credenciales y guarda el refresh token (hash) generado por NestJS
-- =============================================================================
CREATE OR REPLACE FUNCTION sp_usuarios_login(
    p_nombre_usuario  VARCHAR,
    p_contrasena      VARCHAR,
    p_refresh_token   VARCHAR,
    p_minutos_refresh INTEGER,
    OUT p_codigo      INTEGER,
    OUT p_mensaje     VARCHAR,
    OUT p_datos       JSON
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_usuario Tbl_Usuarios%ROWTYPE;
BEGIN
    BEGIN
        IF p_nombre_usuario IS NULL OR btrim(p_nombre_usuario) = ''
           OR p_contrasena IS NULL OR p_contrasena = '' THEN
            RAISE EXCEPTION 'Usuario y contraseña son obligatorios.' USING ERRCODE = '22023';
        END IF;

        SELECT * INTO v_usuario
          FROM Tbl_Usuarios
         WHERE NombreUsuario = lower(btrim(p_nombre_usuario));

        IF NOT FOUND OR v_usuario.Contrasena <> crypt(p_contrasena, v_usuario.Contrasena) THEN
            p_codigo := 401; p_mensaje := 'Usuario o contraseña incorrectos.'; p_datos := NULL;
            RETURN;
        END IF;

        IF v_usuario.Estado <> 1 THEN
            p_codigo := 403; p_mensaje := 'El usuario está inactivo.'; p_datos := NULL;
            RETURN;
        END IF;

        UPDATE Tbl_Usuarios
           SET RefreshTokenHash  = fn_hash_token(p_refresh_token),
               ExpiracionRefresh = now() + make_interval(mins => p_minutos_refresh),
               UltimoAcceso      = now()
         WHERE CodigoUsuario = v_usuario.CodigoUsuario;

        p_codigo  := 200;
        p_mensaje := 'Inicio de sesión exitoso.';
        p_datos   := fn_usuario_a_json(v_usuario);
    EXCEPTION
        WHEN invalid_parameter_value THEN
            p_codigo := 400; p_mensaje := SQLERRM; p_datos := NULL;
        WHEN OTHERS THEN
            p_codigo := 500; p_mensaje := 'Error interno al iniciar sesión: ' || SQLERRM; p_datos := NULL;
    END;
END;
$$;

-- =============================================================================
-- REFRESH: valida el refresh token actual y lo rota por uno nuevo
-- =============================================================================
CREATE OR REPLACE FUNCTION sp_usuarios_refresh(
    p_refresh_actual  VARCHAR,
    p_refresh_nuevo   VARCHAR,
    p_minutos_refresh INTEGER,
    OUT p_codigo      INTEGER,
    OUT p_mensaje     VARCHAR,
    OUT p_datos       JSON
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_usuario Tbl_Usuarios%ROWTYPE;
BEGIN
    BEGIN
        IF p_refresh_actual IS NULL OR p_refresh_actual = '' THEN
            RAISE EXCEPTION 'El refresh token es obligatorio.' USING ERRCODE = '22023';
        END IF;

        SELECT * INTO v_usuario
          FROM Tbl_Usuarios
         WHERE RefreshTokenHash = fn_hash_token(p_refresh_actual);

        IF NOT FOUND THEN
            p_codigo := 401; p_mensaje := 'Refresh token inválido o ya utilizado. Inicie sesión nuevamente.'; p_datos := NULL;
            RETURN;
        END IF;

        IF v_usuario.ExpiracionRefresh IS NULL OR v_usuario.ExpiracionRefresh < now() THEN
            UPDATE Tbl_Usuarios SET RefreshTokenHash = NULL, ExpiracionRefresh = NULL
             WHERE CodigoUsuario = v_usuario.CodigoUsuario;
            p_codigo := 401; p_mensaje := 'El refresh token expiró. Inicie sesión nuevamente.'; p_datos := NULL;
            RETURN;
        END IF;

        IF v_usuario.Estado <> 1 THEN
            p_codigo := 403; p_mensaje := 'El usuario está inactivo.'; p_datos := NULL;
            RETURN;
        END IF;

        UPDATE Tbl_Usuarios
           SET RefreshTokenHash  = fn_hash_token(p_refresh_nuevo),
               ExpiracionRefresh = now() + make_interval(mins => p_minutos_refresh),
               UltimoAcceso      = now()
         WHERE CodigoUsuario = v_usuario.CodigoUsuario;

        p_codigo  := 200;
        p_mensaje := 'Token renovado exitosamente.';
        p_datos   := fn_usuario_a_json(v_usuario);
    EXCEPTION
        WHEN invalid_parameter_value THEN
            p_codigo := 400; p_mensaje := SQLERRM; p_datos := NULL;
        WHEN OTHERS THEN
            p_codigo := 500; p_mensaje := 'Error interno al renovar el token: ' || SQLERRM; p_datos := NULL;
    END;
END;
$$;

-- =============================================================================
-- LOGOUT: invalida el refresh token
-- =============================================================================
CREATE OR REPLACE FUNCTION sp_usuarios_logout(
    p_refresh_token VARCHAR,
    OUT p_codigo    INTEGER,
    OUT p_mensaje   VARCHAR,
    OUT p_datos     JSON
)
LANGUAGE plpgsql
AS $$
BEGIN
    BEGIN
        UPDATE Tbl_Usuarios
           SET RefreshTokenHash = NULL, ExpiracionRefresh = NULL
         WHERE RefreshTokenHash = fn_hash_token(COALESCE(p_refresh_token, ''));

        p_codigo  := 200;
        p_mensaje := 'Sesión cerrada exitosamente.';
        p_datos   := NULL;
    EXCEPTION
        WHEN OTHERS THEN
            p_codigo := 500; p_mensaje := 'Error interno al cerrar sesión: ' || SQLERRM; p_datos := NULL;
    END;
END;
$$;

-- =============================================================================
-- PERFIL: datos del usuario autenticado
-- =============================================================================
CREATE OR REPLACE FUNCTION sp_usuarios_perfil(
    p_codigo_usuario INTEGER,
    OUT p_codigo     INTEGER,
    OUT p_mensaje    VARCHAR,
    OUT p_datos      JSON
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_usuario Tbl_Usuarios%ROWTYPE;
BEGIN
    BEGIN
        SELECT * INTO v_usuario FROM Tbl_Usuarios WHERE CodigoUsuario = p_codigo_usuario;
        IF NOT FOUND THEN
            p_codigo := 404; p_mensaje := 'El usuario no existe.'; p_datos := NULL;
            RETURN;
        END IF;
        p_codigo  := 200;
        p_mensaje := 'Perfil obtenido con éxito.';
        p_datos   := fn_usuario_a_json(v_usuario);
    EXCEPTION
        WHEN OTHERS THEN
            p_codigo := 500; p_mensaje := 'Error interno al obtener el perfil: ' || SQLERRM; p_datos := NULL;
    END;
END;
$$;
