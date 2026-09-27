-- =============================================================================
-- Agencia de Viajes y Turismo Multisucursal
-- 01_tablas.sql  -  Base de datos y tablas
-- Tabla asignada: Tbl_Destinos
-- (Se incluyen Tbl_Proveedores y Tbl_Hoteles SOLO para demostrar el mensaje
--  de "registro relacionado" al intentar eliminar un destino con hoteles.)
-- =============================================================================
-- Si lo ejecutas a mano en pgAdmin, primero crea la BD:
--   CREATE DATABASE agencia_viajes_db;
-- y luego conéctate a ella para ejecutar el resto.
-- (Con docker-compose la BD se crea sola.)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- Tbl_Destinos (tabla asignada) - respeta nombres y tipos del diagrama E-R
-- TINYINT(1) de MySQL  ->  SMALLINT en PostgreSQL
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Tbl_Destinos (
    CodigoDestino        SERIAL         PRIMARY KEY,
    NombreDestino        VARCHAR(120)   NOT NULL,
    Ciudad               VARCHAR(100)   NOT NULL,
    Pais                 VARCHAR(100)   NOT NULL,
    Continente           VARCHAR(50)    NOT NULL,
    Descripcion          VARCHAR(350),
    Clima                VARCHAR(80),
    Moneda               VARCHAR(50)    NOT NULL,
    IdiomaPrincipal      VARCHAR(80)    NOT NULL,
    RequiereVisa         SMALLINT       NOT NULL DEFAULT 0,
    CostoPromedioDiario  DECIMAL(12,2)  NOT NULL DEFAULT 0,
    FechaRegistro        DATE           NOT NULL DEFAULT CURRENT_DATE,
    Estado               SMALLINT       NOT NULL DEFAULT 1,
    CONSTRAINT uq_destinos_nombre_ciudad_pais UNIQUE (NombreDestino, Ciudad, Pais),
    CONSTRAINT ck_destinos_requierevisa CHECK (RequiereVisa IN (0,1)),
    CONSTRAINT ck_destinos_estado       CHECK (Estado IN (0,1)),
    CONSTRAINT ck_destinos_costo        CHECK (CostoPromedioDiario >= 0)
);

-- -----------------------------------------------------------------------------
-- Tablas relacionadas (según diagrama E-R)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Tbl_Proveedores (
    CodigoProveedor     SERIAL        PRIMARY KEY,
    NombreComercial     VARCHAR(150)  NOT NULL,
    RazonSocial         VARCHAR(150),
    NIT                 VARCHAR(20),
    TipoProveedor       VARCHAR(80),
    NombreContacto      VARCHAR(120),
    Telefono            VARCHAR(20),
    CorreoElectronico   VARCHAR(150),
    Direccion           VARCHAR(250),
    Pais                VARCHAR(100),
    ComisionPorcentaje  DECIMAL(5,2),
    FechaRegistro       DATE          NOT NULL DEFAULT CURRENT_DATE,
    Estado              SMALLINT      NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS Tbl_Hoteles (
    CodigoHotel         SERIAL        PRIMARY KEY,
    CodigoDestino       INT           NOT NULL REFERENCES Tbl_Destinos(CodigoDestino),
    CodigoProveedor     INT           NOT NULL REFERENCES Tbl_Proveedores(CodigoProveedor),
    NombreHotel         VARCHAR(150)  NOT NULL,
    CategoriaEstrellas  INT,
    Direccion           VARCHAR(250),
    Telefono            VARCHAR(20),
    CorreoElectronico   VARCHAR(150),
    TipoHabitacion      VARCHAR(100),
    PrecioNoche         DECIMAL(12,2),
    HoraEntrada         TIME,
    HoraSalida          TIME,
    IncluyeDesayuno     SMALLINT      NOT NULL DEFAULT 0,
    Estado              SMALLINT      NOT NULL DEFAULT 1
);

-- -----------------------------------------------------------------------------
-- Tbl_Usuarios - para login con Access Token (JWT) y Refresh Token
-- La contraseña se guarda cifrada con bcrypt (pgcrypto).
-- El refresh token se guarda como hash SHA-256 (nunca en texto plano).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Tbl_Usuarios (
    CodigoUsuario        SERIAL        PRIMARY KEY,
    NombreUsuario        VARCHAR(50)   NOT NULL UNIQUE,
    Contrasena           VARCHAR(100)  NOT NULL,
    NombreCompleto       VARCHAR(150)  NOT NULL,
    Rol                  VARCHAR(30)   NOT NULL DEFAULT 'ADMIN',
    RefreshTokenHash     VARCHAR(100),
    ExpiracionRefresh    TIMESTAMP,
    UltimoAcceso         TIMESTAMP,
    FechaRegistro        DATE          NOT NULL DEFAULT CURRENT_DATE,
    Estado               SMALLINT      NOT NULL DEFAULT 1
);
