const express = require('express');
const cors = require('cors');
const equipoRoutes = require('./routes/equipo.routes');
const problemaRoutes = require('./routes/problema.routes');
const componenteRoutes = require('./routes/componente.routes');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/equipos', equipoRoutes);
app.use('/api/problemas', problemaRoutes);
app.use('/api/componentes', componenteRoutes);


module.exports = app;
