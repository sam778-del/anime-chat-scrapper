'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.engine4_group_groups = require('./engine4_group_groups.js')(sequelize, Sequelize);
db.engine4_group_actions = require('./engine4_activity_actions.js')(sequelize, Sequelize);
db.engine4_activity_stream = require('./engine4_activity_stream.js')(sequelize, Sequelize);
db.engine4_activity_comments = require('./engine4_activity_comments.js')(sequelize, Sequelize);
// db.users = require('./user_model.js')(sequelize, Sequelize);
// db.roles = require('./role.js')(sequelize, Sequelize);
// db.permissions = require('./permission.js')(sequelize, Sequelize);
// db.role_permissions = require('./rolepermission.js')(sequelize, Sequelize);

module.exports = db;
