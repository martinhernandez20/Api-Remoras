const pool = require('../config/db');

/**
 * POST /api/problemas/equipo/:id
 * Reportar problema a un equipo
 */
const reportarProblemaEquipo = async (req, res) => {
  const { id } = req.params;
  const { descripcion } = req.body;

  if (!descripcion) {
    return res.status(400).json({ error: 'Descripción obligatoria' });
  }

  try {
    const equipo = await pool.query(
      'SELECT id FROM equipo WHERE id = $1',
      [id]
    );
    if (equipo.rowCount === 0) {
      return res.status(404).json({ error: 'Equipo no existe' });
    }

    const problema = await pool.query(
      `
      INSERT INTO problemas (descripcion, fecha_informado, reparado)
      VALUES ($1, CURRENT_DATE, false)
      RETURNING *;
      `,
      [descripcion]
    );

    await pool.query(
      `
      INSERT INTO equipo_problemas (equipo_id, problema_id)
      VALUES ($1, $2);
      `,
      [id, problema.rows[0].id]
    );

    await pool.query(
      `UPDATE equipo SET estado = 'Con Problemas' WHERE id = $1`,
      [id]
    );

    res.status(201).json({
      message: 'Problema reportado correctamente',
      problema: problema.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al reportar problema' });
  }
};

/**
 * GET /api/problemas
 */
const getProblemas = async (req, res) => {
  const { activos } = req.query;

  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.descripcion,
        p.fecha_informado,
        p.fecha_solucion,
        p.reparado,
        e.id AS equipo_id,
        e.estado AS equipo_estado,
        d.nombre AS departamento
      FROM problemas p
      JOIN equipo_problemas ep ON ep.problema_id = p.id
      JOIN equipo e ON e.id = ep.equipo_id
      JOIN departamentos d ON d.id = e.departamento_id
      ${activos === 'true' ? 'WHERE p.reparado = false' : ''}
      ORDER BY p.fecha_informado DESC;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener problemas' });
  }
};

/**
 * PUT /api/problemas/:id/solucionar
 * Marca un problema como solucionado y actualiza estado del equipo si corresponde
 */
const solucionarProblema = async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1️⃣ Marcar problema como solucionado
    const problemaResult = await client.query(
      `
      UPDATE problemas
      SET reparado = true,
          fecha_solucion = CURRENT_DATE
      WHERE id = $1
      RETURNING *;
      `,
      [id]
    );

    if (problemaResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Problema no encontrado' });
    }

    // 2️⃣ Obtener equipo asociado
    const equipoResult = await client.query(
      `
      SELECT equipo_id
      FROM equipo_problemas
      WHERE problema_id = $1;
      `,
      [id]
    );

    const equipoId = equipoResult.rows[0].equipo_id;

    // 3️⃣ Verificar si quedan problemas activos
    const pendientes = await client.query(
      `
      SELECT 1
      FROM equipo_problemas ep
      JOIN problemas p ON p.id = ep.problema_id
      WHERE ep.equipo_id = $1
        AND p.reparado = false
      LIMIT 1;
      `,
      [equipoId]
    );

    // 4️⃣ Actualizar estado del equipo
    if (pendientes.rowCount === 0) {
      await client.query(
        `UPDATE equipo SET estado = 'Operativo' WHERE id = $1`,
        [equipoId]
      );
    }

    await client.query('COMMIT');

    res.json({
      message: 'Problema solucionado correctamente',
      problema: problemaResult.rows[0],
      equipo_estado: pendientes.rowCount === 0 ? 'Operativo' : 'Con Problemas'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Error al solucionar problema' });
  } finally {
    client.release();
  }
};

module.exports = {
  reportarProblemaEquipo,
  getProblemas,
  solucionarProblema
};
