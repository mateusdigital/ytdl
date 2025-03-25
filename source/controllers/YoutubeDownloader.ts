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
//  File      : YoutubeDownloader.ts                                          //
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
import ytdl from "@distube/ytdl-core";
import {spawn} from 'child_process';
// -----------------------------------------------------------------------------
import {FileUtils} from "@/mdweb/FileUtils";
import {JsonUtils} from "@/mdweb/JsonUtils";
import {Logger} from "@/mdweb/Logger";

//
// Class
//

// -----------------------------------------------------------------------------
export class YoutubeDownloader
{
  public static IsValidUrl(inputUrl: string): boolean
  {
    return ytdl.validateURL(inputUrl);
  }

  // ---------------------------------------------------------------------------
  public static GetAudioFilenameFromUrl(inputUrl: string): string
  {
    const video_id = ytdl.getVideoID(inputUrl);
    const filename = `${video_id}.mp3`;
    return filename;
  }

  public static GetVideoFilenameFromUrl(inputUrl: string): string
  {
    const video_id = ytdl.getVideoID(inputUrl);
    const filename = `${video_id}.mp4`;
    return filename;
  }

  // ---------------------------------------------------------------------------
  public static GetVideoInfoFilenameFromUrl(inputUrl: string): string
  {
    const video_id = ytdl.getVideoID(inputUrl);
    const filename = `${video_id}.json`;
    return filename;
  }

  // ---------------------------------------------------------------------------
  public static async DownloadInfo(inputUrl: string, downloadPath: string)
  {
    const info = await ytdl.getBasicInfo(inputUrl);

    FileUtils.EnsurePath(downloadPath);
    FileUtils.WriteAllFile(downloadPath, JsonUtils.Serialize(info));
  }

  // ---------------------------------------------------------------------------
  public static async DownloadVideo(inputUrl: string,
                                    downloadPath: string,
                                    writer: any|null): Promise<Boolean>
  {
    return await new Promise((resolve, reject) => {
      _SpawnProcess_ytdlp(downloadPath, inputUrl, writer, resolve, reject);
    });
  }

  // ---------------------------------------------------------------------------
  public static async ConvertVideo(videoPath: string,
                                   audioPath: string,
                                   writer: any|null): Promise<Boolean>
  {
    return await new Promise((resolve, reject) => {
      _SpawnProcess_ffmpeg(videoPath, audioPath, writer, resolve, reject);
    });
  }
}

// -----------------------------------------------------------------------------
function _SpawnProcess_ytdlp(
  filename: string, url: string, writer: any|null, resolve: any, reject: any)
{
  const process = spawn('yt-dlp', [

    "--verbose",
    "-S",
    "ext:mp4:m4a",
    '-o',
    filename,
    url
  ]);
  //
  process.stdout.on('data', (data) => {
    writer!.write(`data: ${data.toString()}\n\n`);
    Logger.Debug(`stdout: ${data.toString()}`);
  });

  //
  process.stderr.on('data', (data) => {
    writer!.write(`data: ${data.toString()}\n\n`);
    Logger.Error(`stderr: ${data.toString()}`);
  });

  //
  process.on('close', (code) => {
    writer!.write(`data: Download complete - status: ${code}\n\n`);
    writer!.write(`event: close\n\n`);

    if (code != 0) {
      reject(new Error(`yt-dlp exited with code ${code}`));
    }
    else {
      resolve(true);
    }
  });
}

// -----------------------------------------------------------------------------
function _SpawnProcess_ffmpeg(videoPath: string,
                              audioPath: string,
                              writer: any|null,
                              resolve: any,
                              reject: any)
{
  const args = [
    "-y",
    "-loglevel",
    // "repeat+info",
    "verbose",
    "-i",
    `file:${videoPath}`,
    "-vn",
    "-acodec",
    "libmp3lame",
    "-q:a",
    "5.0",
    "-movflags",
    "+faststart",
    `file:${audioPath}`
  ];

  const process = spawn('ffmpeg', args);
  //
  process.stdout.on('data', (data) => {
    writer!.write(`data: ${data.toString()}\n\n`);
    Logger.Info(`stdout: ${data.toString()}`);
  });

  //
  process.stderr.on('data', (data) => {
    writer!.write(`data: ${data.toString()}\n\n`);
    Logger.Info(`stderr: ${data.toString()}`);
  });

  //
  process.on('close', (code) => {
    writer!.write(`data: Download complete - status: ${code}\n\n`);
    writer!.write(`event: close\n\n`);

    if (code == 0) {
      resolve(true);
    }
    else {
      reject(new Error(`yt-dlp exited with code ${code}`));
    }
  });
}
