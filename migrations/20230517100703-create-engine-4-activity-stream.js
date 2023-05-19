'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('engine4_activity_streams', {
      target_type: {
        type: Sequelize.STRING
      },
      target_id: {
        type: Sequelize.INTEGER
      },
      subject_type: {
        type: Sequelize.STRING
      },
      subject_id: {
        type: Sequelize.INTEGER
      },
      object_type: {
        type: Sequelize.STRING
      },
      object_id: {
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.STRING
      },
      action_id: {
        type: Sequelize.INTEGER
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('engine4_activity_streams');
  }
};