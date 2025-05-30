

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
import { ThrowCriticalErrorIf, ThrowIfEmptyOrNull, ThrowIfNotAuthorized, ThrowIfNotValidObjectId, ThrowLogicErrorIf, ThrowNotFoundErrorIf } from "../../lib/mdweb/source/ErrorUtils/ThrowIf";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { Authorize } from "source/other/Auth";
import { UserService } from "source/services/UserService";

// -----------------------------------------------------------------------------
export const Download_Schema = Joi.object({
  url: Joi.string().required(),
});

export class UserRouteController {


  //
  //
  //

  // ---------------------------------------------------------------------------
  @POST({ route: "/user" })
  static async CreateUser(req: Request, res: Response) {
    const { auth }  = Authorize(req, res);
    const { username } = req.body;

    ThrowIfEmptyOrNull(username, "Username cannot be empty");
    ThrowIfNotAuthorized(auth);

    const user = UserService.GetUserWithUsername(username);
    ThrowLogicErrorIf(user != null, "user already exists");

    const result = await UserService.CreateUser(username);
    ThrowCriticalErrorIf(!result, "Failed to create user");

    return ResponseStatus.OK(req, res, result);
  }
}
