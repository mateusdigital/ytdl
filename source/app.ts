// -----------------------------------------------------------------------------
import path from 'path'
import express from 'express';
// -----------------------------------------------------------------------------
import { App } from '../lib/mdweb/source/Express/App';
import { Logger } from 'lib/mdweb/source/Logger';
import { MongoUtils } from 'lib/mdweb/source/DB/MongoUtils';
import { SetupErrorHandler } from '../lib/mdweb/source/Express/Middleware/ErrorHandler';
import { SetupRoutesWithController } from '../lib/mdweb/source/Routes/RouteUtils';
import { SetupServiceInfoPage } from '../lib/mdweb/source/Routes/DefaultRoutes';
// -----------------------------------------------------------------------------
import packageJson from '../package.json';
// -----------------------------------------------------------------------------
import { TaskRouteController } from './controllers/TaskRouteController';
import { UserRouteController } from './controllers/UserRouteController';

//
// Env
//

// -----------------------------------------------------------------------------
require('dotenv').config();

//
//  App
//

// -----------------------------------------------------------------------------
const options = {
  publicPath: path.join(__dirname, '../', 'public'),
  packageJson
};

// -----------------------------------------------------------------------------
App.Init(options);
{
  const app = App.GetExpressApp();

  app.use(express.static(options.publicPath));

  SetupServiceInfoPage(app, path.join(options.publicPath, "index.html"));

  SetupRoutesWithController(TaskRouteController, app);
  SetupRoutesWithController(UserRouteController, app);

  SetupErrorHandler(app);
}

MongoUtils.MakeMongooseConnect(
  // options:
  {
    MONGO_URI: process.env.MONGO_URI || '',
    MONGO_USER: process.env.MONGO_USER || '',
    MONGO_PASSWORD: process.env.MONGO_PASSWORD || ''
  },
  // success:
  () => {
    Logger.Info("MongoDB connection established successfully.");
    Logger.Info("Tasks2me is live at http://localhost:3000");
    App.StartListen(3000);
  },
  // error:
  (err: any) => {
    Logger.Error("MongoDB connection error:", err);
  }
);
