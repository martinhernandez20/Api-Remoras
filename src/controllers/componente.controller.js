const pool = require('../config/db');

/**
 * GET /api/componentes
 * Lista todos los componentes disponibles
 */
const getComponentes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nombre, tipo
      FROM componente
      ORDER BY nombre;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener componentes' });
  }
};

/**
 * GET /api/componentes/equipo/:equipoId
 * Lista componentes asociados a un equipo
 */
const getComponentesByEquipo = async (req, res) => {
  const { equipoId } = req.params;

  try {
    const result = await pool.query(
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
      [equipoId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener componentes del equipo' });
  }
};

/**
 * POST /api/componentes/asignar
 * Asignar un componente a un equipo
 */
const addComponenteToEquipo = async (req, res) => {
  const { equipo_id, componente_id, descripcion, cantidad } = req.body;

  if (!equipo_id || !componente_id || !descripcion) {
    return res.status(400).json({
      error: 'equipo_id, componente_id y descripcion son obligatorios'
    });
  }

  try {
    const existe = await pool.query(
      `
      SELECT 1
      FROM equipo_componente
      WHERE equipo_id = $1 AND componente_id = $2;
      `,
      [equipo_id, componente_id]
    );

    if (existe.rowCount > 0) {
      return res.status(409).json({
        error: 'El componente ya está asignado a este equipo'
      });
    }

    const result = await pool.query(
      `
      INSERT INTO equipo_componente (
        equipo_id,
        componente_id,
        descripcion,
        cantidad
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `,
      [equipo_id, componente_id, descripcion, cantidad || 1]
    );

    res.status(201).json({
      message: 'Componente asignado correctamente',
      componente: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al asignar componente' });
  }
};

module.exports = {
  getComponentes,
  getComponentesByEquipo,
  addComponenteToEquipo
};
