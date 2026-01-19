const express = require('express');
const router = express.Router();

const {
  getComponentes,
  getComponentesByEquipo,
  addComponenteToEquipo
} = require('../controllers/componente.controller');

router.get('/', getComponentes);
router.get('/equipo/:equipoId', getComponentesByEquipo);
router.post('/asignar', addComponenteToEquipo);

module.exports = router;
