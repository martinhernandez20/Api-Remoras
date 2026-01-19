const express = require('express');
const router = express.Router();

const {
  reportarProblemaEquipo,
  getProblemas,
  solucionarProblema
} = require('../controllers/problema.controller');

router.post('/equipo/:id', reportarProblemaEquipo);
router.get('/', getProblemas);
router.put('/:id/solucionar', solucionarProblema);

module.exports = router;
