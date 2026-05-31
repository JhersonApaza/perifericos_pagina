/**
 * config/database.js
 * Instancia única de Sequelize/MySQL para toda la aplicación.
 * Renombrado desde config/conexion.js — configuración 100% preservada.
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    define: { timestamps: false },
    dialectOptions: {
      charset: 'utf8',
    },
  }
);

module.exports = sequelize;
