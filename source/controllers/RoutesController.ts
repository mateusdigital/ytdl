//----------------------------------------------------------------------------//
//                               *       +                                    //
//                         '                  |                               //
//                     ()    .-.,="``"=.    - o -                             //
//                           '=/_       \     |                               //
//                        *   |  '=._    |                                    //
//                             \     `=./`,        '                          //
//                          .   '=.__.=' `='      *                           //
//                 +                         +                                //
//                      O      *        '       .                             //
//                                                                            //
//  File      : RoutesController.ts                                           //
//  Project   : controllers                                                   //
//  Date      : 2025-03-24                                                    //
//  License   : See project's COPYING.TXT for full info.                      //
//  Author    : mateus.digital <hello@mateus.digital>                         //
//  Copyright : mateus.digital - 2025                                         //
//                                                                            //
//  Description :                                                             //
//                                                                            //
//----------------------------------------------------------------------------//

// -----------------------------------------------------------------------------
import path from "path";
import Joi from "joi";
import fs from "fs";
// -----------------------------------------------------------------------------
import {Request, Response} from "express";
// -----------------------------------------------------------------------------
import {Assert} from "@/mdweb/Assert";
import {ResponseStatus} from "@/mdweb/Net/ResponseStatus";
import {GET, POST} from "@/mdweb/Routes/RouteDecorators";
import {FileUtils} from "@/mdweb/FileUtils";
// -----------------------------------------------------------------------------
import {YoutubeDownloader} from "./YoutubeDownloader";
import {Error_CriticalError} from "@/mdweb/ErrorUtils/Exceptions";
import {ThrowNotFoundErrorIf} from "@/mdweb/ErrorUtils/ThrowIf";
import {Service} from "./RoutesService";
import {info} from "console";

// -----------------------------------------------------------------------------
export const Download_Schema = Joi.object({
  url : Joi.string().required(),
});

function     _GetDefaultDownloadPath()
{
  return process.env.DOWNLOAD_PATH || "./downloads";
}

// -----------------------------------------------------------------------------
export class ServiceRoutesController
{
  // ---------------------------------------------------------------------------
  @GET({route : "/stream/*"})
  static async StreamMusic(req: Request, res: Response)
  {
    const full_url = req.originalUrl.replace("/api/stream/", "");
    console.log("Received URL: ", full_url);

    //
    const audio_filename = YoutubeDownloader.GetAudioFilenameFromUrl(full_url);
    const audio_fullpath = path.join(_GetDefaultDownloadPath(), audio_filename);

    //
    if (!FileUtils.FileExists(audio_fullpath)) {
      return res.status(404).send("Video Not found");
    }

    // Stream the file...
    Assert(FileUtils.FileExists(audio_fullpath),
           `File doesn't exist. - ${audio_fullpath}`);

    //
    const audio_stats = FileUtils.Stat(audio_fullpath);

    res.setHeader("Content-Type", "audio/mp3");
    res.setHeader("Content-Length", audio_stats.size);
    res.setHeader("Accept-Ranges", "bytes");

    const readStream = fs.createReadStream(audio_fullpath);
    readStream.pipe(res);

    readStream.on("error", (error) => {
      //
      throw Error_CriticalError.FromCatchClauseError(error);
    });
  }

  // ---------------------------------------------------------------------------
  @GET({route : "/info/*"}) //
  static async GetInfo(req: Request, res: Response)
  {
    const full_url = req.originalUrl.replace("/api/info/", "");
    const dir_path = _GetDefaultDownloadPath();

    const payload = await Service.GetInfo({dirPath : dir_path, url : full_url});
    return ResponseStatus.OK(req, res, payload);
  }

  // ---------------------------------------------------------------------------
  @GET({route : "/download-video/*"})
  static async Download(req: Request, res: Response)
  {
    const full_url    = req.originalUrl.replace("/api/download-video/", "");
    const decoded_url = decodeURIComponent(full_url);
    const path        = _GetDefaultDownloadPath();

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const result = await Service.DownloadVideo(
      {dirPath : path, url : decoded_url, writer : res});

    res.end();
  }

  // ---------------------------------------------------------------------------
  @GET({route : "/convert-video/*"})
  static async Convert(req: Request, res: Response)
  {
    const full_url    = req.originalUrl.replace("/api/convert-video/", "");
    const decoded_url = decodeURIComponent(full_url);
    const path        = _GetDefaultDownloadPath();

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const result = await Service.ConvertVideo(
      {dirPath : path, url : decoded_url, writer : res});

    res.end();
  }
}
