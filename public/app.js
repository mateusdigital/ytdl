//
// Elements
//

// -----------------------------------------------------------------------------
const g_YoutubeUrlInput     = document.getElementById("youtubeInput");
const g_AudioPlayer         = document.getElementById("audioPlayer");
const g_MediaCover          = document.getElementById("mediaCover");
const g_FetchButton         = document.getElementById("playBtn");
const g_DownloadMusicButton = document.getElementById("downloadMusicButton");
const g_DownloadVideoButton = document.getElementById("downloadVideoButton");
const g_ProgressBar         = document.getElementById("progressBar");
//
// Constants
//

// -----------------------------------------------------------------------------
const STREAM_ENDPOINT         = "http://localhost:3000/api/stream/";
const INFO_ENDPOINT           = "http://localhost:3000/api/info/";
const DOWNLOAD_VIDEO_ENDPOINT = "http://localhost:3000/api/download-video/";
const CONVERT_VIDEO_ENDPOINT  = "http://localhost:3000/api/convert-video/";
const DOWNLOAD_LINK           = "http://localhost:3000/_download/";

//
// Globals
//

// -----------------------------------------------------------------------------
let g_YoutubeUrl = "https://www.youtube.com/watch?v=wB7FXxNLH6g";
let g_InfoData   = null;

// -----------------------------------------------------------------------------
function _IsAnPossibleValidYoutubeUrl(url)
{
  const pattern = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/;
  return pattern.test(url);
}

//
// UI Handlers
//

// -----------------------------------------------------------------------------
async function _FetchInfo()
{
  const info_response = await fetch(`${INFO_ENDPOINT}${g_YoutubeUrl}`);
  if (!info_response.ok) {
    return null;
  }

  return info_response;
}

// -----------------------------------------------------------------------------
async function _OnStartFetchDataButtonClicked()
{
  try {
    //
    g_YoutubeUrl            = g_YoutubeUrlInput.value || g_YoutubeUrl;
    g_YoutubeUrlInput.value = g_YoutubeUrl;

    g_FetchButton.className         = "buttonDisabled";
    g_FetchButton.innerText         = "Fetching Info...";
    g_DownloadMusicButton.className = "buttonDisabled";
    g_DownloadVideoButton.className = "buttonDisabled";

    try {
      const info_response = await _FetchInfo();
      const json          = await info_response.json();
      g_InfoData          = json.payload;

      _SetCoverImage();
      g_FetchButton.className = "";
      g_FetchButton.innerText = "Fetch again...";

      //
      if (g_InfoData.videoExists) {
        g_DownloadVideoButton.className = "";

        if (g_InfoData.audioExists) {
          g_DownloadMusicButton.className = "";
          _SetAudioStream();
        }
      }
      else {
        g_FetchButton.innerText = "Downloading data...";
        g_FetchButton.className = "buttonDownloading";

        _CallDownloadVideoApi();
      }
    }
    catch (error) {
      console.log(error);
      // _SetError(error);
    }
  }
  catch (err) {
    alert("Error: " + err.message);
  }
}

// -----------------------------------------------------------------------------
function _OnDownloadMusicButtonClicked()
{
  const url  = `${DOWNLOAD_LINK}/${g_InfoData.audioFilename}`;
  const link = document.createElement("a");
  link.href  = url;
  // link.download = url.split("/").pop(); // Extracts the file name from the URL
  link.target = "_blank";
  link.click();
}
// -----------------------------------------------------------------------------
function _OnDownloadVideoButtonClicked()
{
  const url  = `${DOWNLOAD_LINK}/${g_InfoData.videoFilename}`;
  const link = document.createElement("a");
  link.href  = url;
  // link.download = url.split("/").pop(); // Extracts the file name from the URL
  link.target = "_blank";
  link.click();
}

//
// Helpers
//

// -----------------------------------------------------------------------------
function _SetCoverImage()
{
  data = g_InfoData;

  const thumbnail =
    data.info?.player_response?.videoDetails?.thumbnail?.thumbnails?.pop()?.url;
  g_MediaCover.src = thumbnail || "";

  g_MediaCover.onload = () => { g_MediaCover.style.display = "block"; };
}

// -----------------------------------------------------------------------------
function _SetAudioStream()
{
  const youtubeUrl  = g_YoutubeUrl;
  g_AudioPlayer.src = `${STREAM_ENDPOINT}${youtubeUrl}`;
  g_AudioPlayer.play()
    .then(() => { g_AudioPlayer.style.display = "block"; })
    .catch((error) => { console.error("Error playing audio:", error); });
}

//
// Api Calls
//

// -----------------------------------------------------------------------------
async function _CallDownloadVideoApi()
{
  const youtubeUrl = g_YoutubeUrl;
  const encoded    = encodeURIComponent(youtubeUrl);
  const url        = `${DOWNLOAD_VIDEO_ENDPOINT}${encoded}`;

  try {
    const event_source = new EventSource(url);
    //
    event_source.onopen = () => {
      //
      console.log('Connection opened');
    };
    //

    event_source.onmessage = (event) => {
      //
    };

    //
    event_source.onerror = (err) => {
      event_source.close();
      _OnDownloadVideoApiCallDidFinish();
    };

    //
    event_source.onclose = () => {
      //
      _OnDownloadVideoApiCallDidFinish();
    };
  }
  catch (err) {
    console.log(err);
  }
}

// -----------------------------------------------------------------------------
async function _OnDownloadVideoApiCallDidFinish()
{
  g_FetchButton.innerText = "Converting video...";
  g_FetchButton.className = "buttonConverting";

  g_DownloadVideoButton.className = "";
  _CallConvertVideoApi();
}

// -----------------------------------------------------------------------------
async function _CallConvertVideoApi()
{
  const youtubeUrl = g_YoutubeUrl;
  const encoded    = encodeURIComponent(youtubeUrl);
  const url        = `${CONVERT_VIDEO_ENDPOINT}${encoded}`;

  try {
    const event_source = new EventSource(url);
    //
    event_source.onopen = () => {
      //
      console.log('Connection opened');
    };
    //

    event_source.onmessage = (event) => {
      //
    };

    //
    event_source.onerror = (err) => {
      event_source.close();
      _OnConvertVideoApiCallDidFinish();
    };

    //
    event_source.onclose = () => {
      //
      _OnConvertVideoApiCallDidFinish();
    };
  }
  catch (err) {
    console.log(err);
  }
}
// -----------------------------------------------------------------------------
function _OnConvertVideoApiCallDidFinish()
{
  g_DownloadMusicButton.className = "";

  g_FetchButton.innerText = "Fetch again...";
  g_FetchButton.className = "";

  _SetAudioStream();
}

//
// Entry Point
//

// -----------------------------------------------------------------------------
g_FetchButton.addEventListener("click",
                               () => {_OnStartFetchDataButtonClicked()});
g_DownloadMusicButton.addEventListener("click",
                                       () => {_OnDownloadMusicButtonClicked()});
g_DownloadVideoButton.addEventListener("click",
                                       () => {_OnDownloadVideoButtonClicked()});
