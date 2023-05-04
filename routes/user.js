const Sequelize = require('sequelize');
const conn = require('./connection');


const User = conn.sequelize.define('users', {
    firstName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    lastName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    balance: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false,
        defaultValue: 100.00
      }
});

conn.sequelize.sync()
  .then(() => console.log('Models synced...'))
  .catch(err => console.log('Error: ' + err));

module.exports = User;
