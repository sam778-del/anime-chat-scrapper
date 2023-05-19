'use strict';
const {
  Model,
  Sequelize
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class engine4_activity_actions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  engine4_activity_actions.init({
    action_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING
    },
    subject_type: {
      type: DataTypes.STRING
    },
    subject_id: {
      type: DataTypes.INTEGER
    },
    object_type: {
      type: DataTypes.STRING
    },
    object_id: {
      type: DataTypes.INTEGER
    },
    body: {
      type: DataTypes.STRING
    },
    params: {
      type: DataTypes.STRING
    },
    privacy: {
      type: DataTypes.STRING
    },
    comment_count: {
      type: DataTypes.INTEGER
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      field: 'date'
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      field: 'modified_date'
    }
  }, {
    sequelize,
    modelName: 'engine4_activity_actions',
  });
  return engine4_activity_actions;
};