SELECT
  e.id,
  e.nombre,
  e.tipo,
  e.numero_serie,
  u.nombre AS ubicacion,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM problema p
      WHERE p.equipo_id = e.id
        AND p.reparado = false
    )
    THEN true
    ELSE false
  END AS tiene_problema
FROM equipo e
LEFT JOIN ubicacion u ON u.id = e.ubicacion_id
ORDER BY e.nombre;
-- Esta consulta obtiene una lista de todos los equipos junto con su ubicación y un indicador
-- que señala si el equipo tiene algún problema no reparado.

SELECT DISTINCT
  e.id,
  e.nombre,
  e.tipo,
  e.numero_serie,
  u.nombre AS ubicacion
FROM equipo e
JOIN problema p ON p.equipo_id = e.id
LEFT JOIN ubicacion u ON u.id = e.ubicacion_id
WHERE p.reparado = false
ORDER BY e.nombre;
-- Esta consulta obtiene una lista de equipos que tienen problemas no reparados, junto con su ubicación.

SELECT
  e.id AS equipo_id,
  e.nombre AS equipo,
  c.id AS componente_id,
  c.nombre AS componente,
  c.tipo
FROM equipo e
LEFT JOIN equipo_componente ec ON ec.equipo_id = e.id
LEFT JOIN componente c ON c.id = ec.componente_id
WHERE e.id = $1;
-- Esta consulta obtiene los componentes asociados a un equipo específico identificado por su ID.

INSERT INTO problema (
  equipo_id,
  descripcion,
  fecha_informado,
  reparado
)
VALUES (
  $1,
  $2,
  CURRENT_DATE,
  false
)
RETURNING *;
-- Esta consulta inserta un nuevo problema para un equipo específico, marcándolo como no reparado.

SELECT
  p.id,
  p.descripcion,
  p.fecha_informado,
  e.nombre AS equipo
FROM problema p
JOIN equipo e ON e.id = p.equipo_id
WHERE p.reparado = false
ORDER BY p.fecha_informado DESC;
-- Esta consulta obtiene una lista de todos los problemas no reparados junto con el nombre del equipo asociado.

SELECT
  p.id,
  p.descripcion,
  p.fecha_informado,
  p.fecha_solucion,
  p.reparado,
  e.nombre AS equipo
FROM problema p
JOIN equipo e ON e.id = p.equipo_id
ORDER BY p.fecha_informado DESC;
-- Esta consulta obtiene una lista de todos los problemas, tanto reparados como no reparados, junto con el nombre del equipo asociado.

UPDATE problema
SET
  reparado = true,
  fecha_solucion = CURRENT_DATE
WHERE id = $1
RETURNING *;
-- Esta consulta marca un problema específico como reparado y establece la fecha de solución a la fecha actual.

SELECT 1
FROM equipo_componente
WHERE equipo_id = $1
  AND componente_id = $2;
-- Esta consulta verifica si un componente específico ya está asociado a un equipo específico.

INSERT INTO equipo_componente (equipo_id, componente_id)
VALUES ($1, $2)
RETURNING *;
-- Esta consulta asocia un componente específico a un equipo específico.

INSERT INTO equipo (
  nombre,
  tipo,
  numero_serie,
  ubicacion_id
)
VALUES (
  $1,
  $2,
  $3,
  $4
)
RETURNING *;
-- Esta consulta inserta un nuevo equipo en la base de datos con los detalles proporcionados.

