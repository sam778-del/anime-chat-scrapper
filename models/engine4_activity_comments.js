'use strict';
const {
  Model,
  Sequelize
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class engine4_activity_comments extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  engine4_activity_comments.init({
    comment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false
    },
    resource_id: DataTypes.INTEGER,
    poster_type: DataTypes.STRING,
    poster_id: DataTypes.INTEGER,
    body: DataTypes.STRING,
    creation_date: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    like_count: DataTypes.INTEGER,
    params: DataTypes.STRING,
    is_bot: DataTypes.BOOLEAN,
    is_bot_reply: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'engine4_activity_comments',
    timestamps: false,
  });
  return engine4_activity_comments;
};