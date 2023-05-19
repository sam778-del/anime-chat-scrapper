'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class engine4_activity_stream extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  engine4_activity_stream.init({
    target_type: {
      type: DataTypes.STRING
    },
    target_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false
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
    type: {
      type: DataTypes.STRING
    },
    action_id: {
      type: DataTypes.INTEGER
    },
  }, {
    sequelize,
    tableName: 'engine4_activity_stream',
    timestamps: false,
  });
  return engine4_activity_stream;
};