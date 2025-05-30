
// -----------------------------------------------------------------------------
import path from "path";
import Joi from "joi";
import fs from "fs";
// -----------------------------------------------------------------------------
import { Request, Response } from "express";
// -----------------------------------------------------------------------------
import { Assert } from "../../lib/mdweb/source/Assert";
import { Error_CriticalError } from "../../lib/mdweb/source/ErrorUtils/Exceptions";
import { FileUtils } from "../../lib/mdweb/source/FileUtils";
import { GET, POST } from "../../lib/mdweb/source/Routes/RouteDecorators";
import { ResponseStatus } from "../../lib/mdweb/source/Net/ResponseStatus";
import { ThrowIfNotAuthorized, ThrowIfNotValidObjectId, ThrowNotFoundErrorIf } from "../../lib/mdweb/source/ErrorUtils/ThrowIf";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { Authorize } from "source/other/Auth";
import { UserService } from "source/services/UserService";
import { TaskService } from "source/services/TaskService";

// -----------------------------------------------------------------------------
export const Download_Schema = Joi.object({
  url: Joi.string().required(),
});

export class TaskRouteController {


  //
  //
  //

  // ---------------------------------------------------------------------------
  @GET({ route: "/tasks/*" })
  static async GetTasks(req: Request, res: Response) {
    const { auth }  = Authorize(req, res);
    const { userId } = req.body.userId;

    ThrowIfNotValidObjectId(userId);
    ThrowIfNotAuthorized(auth, { userId }, "Forbidden");

    const user = UserService.GetUserWithId(userId);
    ThrowNotFoundErrorIf(!user, "User not found");

    const tasks = await TaskService.GetTasksForUser(userId);
    return ResponseStatus.OK(req, res, tasks);
  }

}
