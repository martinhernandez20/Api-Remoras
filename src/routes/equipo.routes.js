const express = require('express');
const router = express.Router();

const {
  getEquipos,
  getEquiposConProblemas,
  crearEquipo,
  actualizarEstadoEquipo,
  getEquipoDetalle,
  getProblemasByEquipo
} = require('../controllers/equipo.controller');

router.get('/', getEquipos);
router.get('/con-problemas', getEquiposConProblemas);
router.get('/:id/detalle', getEquipoDetalle);
router.post('/', crearEquipo);
router.put('/:id/estado', actualizarEstadoEquipo);
router.get('/:id/problemas', getProblemasByEquipo);


module.exports = router;
