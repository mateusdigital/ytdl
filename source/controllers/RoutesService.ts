// -----------------------------------------------------------------------------
import path from "path";
import Joi from "joi";
import fs from "fs";
// -----------------------------------------------------------------------------
import {Request, Response} from "express";
// -----------------------------------------------------------------------------
import {Assert} from "../../lib/mdweb/source/Assert";
import {ResponseStatus} from "../../lib/mdweb/source/Net/ResponseStatus";
import {GET, POST} from "../../lib/mdweb/source/Routes/RouteDecorators";
import {FileUtils} from "../../lib/mdweb/source/FileUtils";
import {Error_CriticalError} from "../../lib/mdweb/source/ErrorUtils/Exceptions";
import {
  ThrowCriticalErrorIf,
  ThrowNotFoundErrorIf
} from "../../lib/mdweb/source/ErrorUtils/ThrowIf";
import {Logger} from "../../lib/mdweb/source/Logger";
// -----------------------------------------------------------------------------
import {YoutubeDownloader} from "./YoutubeDownloader";
import WritableBase from "stream";

// -----------------------------------------------------------------------------
export const Download_Schema = Joi.object({
  path : Joi.string().required(),
  url : Joi.string().required(),
});

// -----------------------------------------------------------------------------
export class Service
{
  // ---------------------------------------------------------------------------
  static async GetInfo({dirPath, url}: {dirPath: string, url: string})
  {
    Logger.Debug("Received URL: ", url);
    ThrowCriticalErrorIf(!YoutubeDownloader.IsValidUrl(url),
                         "Invalid youtube url");

    //
    FileUtils.EnsurePath(dirPath, true);

    const audio_filename = YoutubeDownloader.GetAudioFilenameFromUrl(url);
    const video_filename = YoutubeDownloader.GetVideoFilenameFromUrl(url);
    const info_filename  = YoutubeDownloader.GetVideoInfoFilenameFromUrl(url);

    const info_fullpath  = path.join(dirPath, info_filename);
    const video_fullpath = path.join(dirPath, video_filename);
    const audio_fullpath = path.join(dirPath, audio_filename);

    try {
      if (!FileUtils.FileExists(info_fullpath)) {
        await YoutubeDownloader.DownloadInfo(url, info_fullpath);
      }

      //
      const info_content = FileUtils.ReadAllFile(info_fullpath);

      const payload = {
        info : JSON.parse(info_content),
        audioFilename : audio_filename,
        audioExists : FileUtils.FileExists(audio_fullpath),
        videoFilename : video_filename,
        videoExists : FileUtils.FileExists(video_fullpath)
      };

      return payload;
    }
    catch (error) {
      Logger.Error("Error downloading video info:", error);
      FileUtils.RemoveFile(info_fullpath);

      throw Error_CriticalError.FromCatchClauseError(error);
    }
  }

  // ---------------------------------------------------------------------------
  static async DownloadVideo({dirPath, url, writer = null}:
                               {dirPath: string, url: string, writer: any|null})
  {

    ThrowCriticalErrorIf(!YoutubeDownloader.IsValidUrl(url),
                         "Invalid youtube url");

    const video_filename = YoutubeDownloader.GetVideoFilenameFromUrl(url);
    const video_fullpath = path.join(dirPath, video_filename);

    FileUtils.EnsurePath(video_fullpath);
    try {
      if (FileUtils.FileExists(video_fullpath)) {
        return true;
      }

      return await YoutubeDownloader.DownloadVideo(url, video_fullpath, writer);
    }
    catch (error) {
      Logger.Error("Error downloading video:", error);
      FileUtils.RemoveFile(video_fullpath);

      throw Error_CriticalError.FromCatchClauseError(error);
    }
  }

  // ---------------------------------------------------------------------------
  static async ConvertVideo({dirPath, url, writer = null}:
                              {dirPath: string, url: string, writer: any|null})
  {

    ThrowCriticalErrorIf(!YoutubeDownloader.IsValidUrl(url),
                         "Invalid youtube url");

    FileUtils.EnsurePath(dirPath, true);

    //
    const video_filename = YoutubeDownloader.GetVideoFilenameFromUrl(url);
    const audio_filename = YoutubeDownloader.GetAudioFilenameFromUrl(url);
    const video_fullpath = path.join(dirPath, video_filename);
    const audio_fullpath = path.join(dirPath, audio_filename);

    ThrowNotFoundErrorIf(!FileUtils.FileExists(video_fullpath),
                         "Video file not found.");

    try {
      if (FileUtils.FileExists(audio_fullpath)) {
        return true;
      }

      return await YoutubeDownloader.ConvertVideo(
        video_fullpath, audio_fullpath, writer);
    }
    catch (error) {
      Logger.Error("Error converting video:", error);
      FileUtils.RemoveFile(audio_fullpath);
      return null;
    }
  }
}
