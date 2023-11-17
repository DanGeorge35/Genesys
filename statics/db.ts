/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'
dotenv.config()

const sequelize = new Sequelize(
  process.env.DB ?? '',
  process.env.DBUSER ?? '',
  process.env.DBPASS ?? '',
  {
    host: 'localhost',
    dialect: 'mysql',
    port: 3306
  }
)

try {
  sequelize.authenticate()
  console.log('Connection has been established successfully.')
} catch (error) {
  console.error('Unable to connect to the database:', error)
  sequelize.close()
}

export default sequelize
