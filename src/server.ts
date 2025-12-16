import app from './app';
import {env} from './config/env';
import {db, initDB} from './config/db';

async function start() {
  try{
    await initDB();
    console.log("Database Connected")

    app.listen(Number(env.PORT), ()=>{
    console.log(`Server running on port ${env.PORT}`)
  })
  } catch (err) {
    console.error('Failed to start server', err)
    process.exit(1)
  }
}

start();