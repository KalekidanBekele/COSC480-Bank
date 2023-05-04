const Sequelize = require("sequelize");

const sequelize = new Sequelize(
   'bankproject',
   'root',
   '',
    {
      host: 'localhost',
      dialect: 'mysql'
    }
  );

module.exports = {
   sequelize
};