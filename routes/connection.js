const Sequelize = require("sequelize");

const sequelize = new Sequelize(
   'heroku_2a38526b70ff8a4', //'bankproject',
   'baa6318898e6a2', //'root',
   'a559d61a', //'',
    {
      host: 'us-cdbr-east-06.cleardb.net', //'localhost',
      dialect: 'mysql',
      createDatabaseIfNotExist: true
    }
  );

module.exports = {
   sequelize
};