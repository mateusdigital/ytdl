// -----------------------------------------------------------------------------
import mongoose from 'mongoose';
import path from 'path'
import express from 'express';
// -----------------------------------------------------------------------------
import {App} from '@/mdweb/Express/App';
import {SetupRoutesWithController} from '@/mdweb/Routes/RouteUtils';
import {SetupErrorHandler} from '@/mdweb/Express/Middleware/ErrorHandler';
// -----------------------------------------------------------------------------
import packageJson from '../package.json';
// -----------------------------------------------------------------------------
import {ServiceRoutesController} from './controllers/RoutesController';

//
// Env
//

// -----------------------------------------------------------------------------
require('dotenv').config();

//
//  App
//

const options = {
  publicPath : path.join(__dirname, '../', 'public'),
  packageJson
};

App.Init(options);
{
  const app = App.GetExpressApp();

  console.log('Public path: ', options.publicPath);
  app.use(express.static(options.publicPath));
  SetupRoutesWithController(ServiceRoutesController, app);
  SetupErrorHandler(app);
  // // Global error handler
  // app.use((err: any, req: any, res: any, next: any) => {
  //   console.error(err.stack);
  //   res.status(500).send('Something broke!');
  // });
}

App.StartListen(3000);
