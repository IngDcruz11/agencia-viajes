-- =============================================================================
-- 04_datos_prueba.sql  -  5 registros de prueba en Tbl_Destinos (vía SP)
--                         + usuario admin + 1 hotel relacionado al destino 1
-- =============================================================================

SELECT * FROM sp_destinos_agregar('Antigua Guatemala', 'Antigua Guatemala', 'Guatemala', 'América',
    'Ciudad colonial Patrimonio de la Humanidad, rodeada de volcanes.', 'Templado',
    'Quetzal (GTQ)', 'Español', 0::SMALLINT, 450.00, 1::SMALLINT);

SELECT * FROM sp_destinos_agregar('Cancún', 'Cancún', 'México', 'América',
    'Playas del Caribe mexicano, zona hotelera y arrecifes.', 'Tropical',
    'Peso mexicano (MXN)', 'Español', 0::SMALLINT, 1200.00, 1::SMALLINT);

SELECT * FROM sp_destinos_agregar('Torre Eiffel', 'París', 'Francia', 'Europa',
    'Capital francesa: museos, gastronomía y arquitectura.', 'Templado oceánico',
    'Euro (EUR)', 'Francés', 1::SMALLINT, 2500.00, 1::SMALLINT);

SELECT * FROM sp_destinos_agregar('Monte Fuji', 'Tokio', 'Japón', 'Asia',
    'Metrópoli moderna con templos tradicionales.', 'Subtropical húmedo',
    'Yen (JPY)', 'Japonés', 1::SMALLINT, 2200.00, 1::SMALLINT);

SELECT * FROM sp_destinos_agregar('Machu Picchu', 'Cusco', 'Perú', 'América',
    'Ciudadela inca en los Andes peruanos.', 'Frío de montaña',
    'Sol (PEN)', 'Español', 0::SMALLINT, 800.00, 1::SMALLINT);

-- Usuario para iniciar sesión:  admin / Admin123
SELECT * FROM sp_usuarios_registrar('admin', 'Admin123', 'Administrador del Sistema');

-- Proveedor + hotel ligado al destino 1 (para probar "registro relacionado" al eliminar)
INSERT INTO Tbl_Proveedores (NombreComercial, RazonSocial, NIT, TipoProveedor, Pais, ComisionPorcentaje)
VALUES ('Hoteles Colonia', 'Hoteles Colonia, S.A.', '1234567-8', 'Hotelería', 'Guatemala', 10.00);

INSERT INTO Tbl_Hoteles (CodigoDestino, CodigoProveedor, NombreHotel, CategoriaEstrellas,
                         TipoHabitacion, PrecioNoche, HoraEntrada, HoraSalida, IncluyeDesayuno)
VALUES (1, 1, 'Hotel Casa Santo Domingo', 5, 'Doble', 950.00, '15:00', '12:00', 1);

-- Verificación
SELECT * FROM Tbl_Destinos ORDER BY CodigoDestino;
