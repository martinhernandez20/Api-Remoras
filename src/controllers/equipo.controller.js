const pool = require('../config/db');

/**
 * GET /api/equipos
 * Lista todos los equipos con indicador de problemas activos
 */
const getEquipos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        e.id,
        e.estado,
        e.fecha_control,
        d.nombre AS departamento,
        d.ubicacion,
        EXISTS (
          SELECT 1
          FROM equipo_problemas ep
          JOIN problemas p ON p.id = ep.problema_id
          WHERE ep.equipo_id = e.id
            AND p.reparado = false
        ) AS tiene_problema
      FROM equipo e
      JOIN departamentos d ON d.id = e.departamento_id
      ORDER BY e.id;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener equipos' });
  }
};

/**
 * GET /api/equipos/con-problemas
 */
const getEquiposConProblemas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT
        e.id,
        e.estado,
        e.fecha_control,
        d.nombre AS departamento,
        d.ubicacion
      FROM equipo e
      JOIN equipo_problemas ep ON ep.equipo_id = e.id
      JOIN problemas p ON p.id = ep.problema_id
      JOIN departamentos d ON d.id = e.departamento_id
      WHERE p.reparado = false
      ORDER BY e.id;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener equipos con problemas' });
  }
};

/**
 * POST /api/equipos
 */
const crearEquipo = async (req, res) => {
  const { usuario_id, departamento_id, fecha_control } = req.body;

  if (!usuario_id || !departamento_id) {
    return res.status(400).json({
      error: 'usuario_id y departamento_id son obligatorios'
    });
  }

  try {
    const usuario = await pool.query(
      'SELECT id FROM usuario WHERE id = $1',
      [usuario_id]
    );
    if (usuario.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no existe' });
    }

    const depto = await pool.query(
      'SELECT id FROM departamentos WHERE id = $1',
      [departamento_id]
    );
    if (depto.rowCount === 0) {
      return res.status(404).json({ error: 'Departamento no existe' });
    }

    const result = await pool.query(
      `
      INSERT INTO equipo (estado, fecha_control, usuario_id, departamento_id)
      VALUES ('Operativo', $1, $2, $3)
      RETURNING *;
      `,
      [fecha_control || null, usuario_id, departamento_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear equipo' });
  }
};

/**
 * PUT /api/equipos/:id/estado
 */
const actualizarEstadoEquipo = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const estadosValidos = ['Operativo', 'Con Problemas', 'En Mantencion'];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }

  try {
    const result = await pool.query(
      'UPDATE equipo SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

/**
 * GET /api/equipos/:id/detalle
 * Obtiene el detalle completo de un equipo
 */
const getEquipoDetalle = async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Datos del equipo
    const equipoResult = await pool.query(
      `
      SELECT
        e.id,
        e.estado,
        e.fecha_control,
        u.nombre AS usuario,
        d.nombre AS departamento,
        d.ubicacion
      FROM equipo e
      JOIN usuario u ON u.id = e.usuario_id
      JOIN departamentos d ON d.id = e.departamento_id
      WHERE e.id = $1;
      `,
      [id]
    );

    if (equipoResult.rowCount === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    // 2️⃣ Componentes del equipo
    const componentesResult = await pool.query(
      `
      SELECT
        ec.id,
        c.nombre,
        c.tipo,
        ec.descripcion,
        ec.cantidad
      FROM equipo_componente ec
      JOIN componente c ON c.id = ec.componente_id
      WHERE ec.equipo_id = $1
      ORDER BY c.nombre;
      `,
      [id]
    );

    // 3️⃣ Problemas del equipo
    const problemasResult = await pool.query(
      `
      SELECT
        p.id,
        p.descripcion,
        p.fecha_informado,
        p.fecha_solucion,
        p.reparado
      FROM problemas p
      JOIN equipo_problemas ep ON ep.problema_id = p.id
      WHERE ep.equipo_id = $1
      ORDER BY p.fecha_informado DESC;
      `,
      [id]
    );

    res.json({
      equipo: equipoResult.rows[0],
      componentes: componentesResult.rows,
      problemas: problemasResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener detalle del equipo' });
  }
};
/**
 * GET /api/equipos/:id/problemas
 * Historial de problemas de un equipo
 */
const getProblemasByEquipo = async (req, res) => {
  const { id } = req.params;

  try {
    // validar equipo
    const equipo = await pool.query(
      'SELECT id FROM equipo WHERE id = $1',
      [id]
    );

    if (equipo.rowCount === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.descripcion,
        p.fecha_informado,
        p.fecha_solucion,
        p.reparado
      FROM problemas p
      JOIN equipo_problemas ep ON ep.problema_id = p.id
      WHERE ep.equipo_id = $1
      ORDER BY p.fecha_informado DESC;
      `,
      [id]
    );

    res.json({
      equipo_id: id,
      total: result.rowCount,
      problemas: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener problemas del equipo' });
  }
};


module.exports = {
  getEquipos,
  getEquiposConProblemas,
  crearEquipo,
  actualizarEstadoEquipo,
  getEquipoDetalle,
  getProblemasByEquipo
};