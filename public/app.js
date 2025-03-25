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
const g_StatusMsg           = document.getElementById("statusMsg");
const g_ProgressBar         = document.getElementById("progressBar");
//
// Constants
//

// -----------------------------------------------------------------------------
const STREAM_ENDPOINT   = "http://localhost:3000/api/stream/";
const INFO_ENDPOINT     = "http://localhost:3000/api/info/";
const DOWNLOAD_ENDPOINT = "http://localhost:3000/api/download/";

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

    g_FetchButton.className = "buttonDisabled";
    g_FetchButton.innerText = "Fetching...";

    try {
      const info_response = await _FetchInfo();
      g_InfoData          = await          info_response.json();

      _SetCoverImage();
      if (g_InfoData.downloaded) {
        g_FetchButton.innerText         = "Fetch again...";
        g_FetchButton.className         = "";
        g_DownloadMusicButton.className = "";
        g_DownloadVideoButton.className = "";

        _SetAudioStream();
      }
      else {
        g_FetchButton.innerText = "Downloading data...";
        g_FetchButton.className = "buttonDownloading";
        _CallDownloadApi();
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
  const url     = "https://example.com/samplefile.zip"; // Replace with your URL
  const link    = document.createElement("a");
  link.href     = url;
  link.download = url.split("/").pop(); // Extracts the file name from the URL
  link.target   = "_blank";             // Opens the link in a new tab
  link.click();
}
// -----------------------------------------------------------------------------
function _OnDownloadVideoButtonClicked() {}

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

  g_MediaCover.onload = () => {
    g_StatusMsg.innerText      = "Playing";
    g_MediaCover.style.display = "block";
  };
}

// -----------------------------------------------------------------------------
function _SetAudioStream()
{
  const youtubeUrl  = g_YoutubeUrl;
  g_AudioPlayer.src = `${STREAM_ENDPOINT}${youtubeUrl}`;
  g_AudioPlayer.play()
    .then(() => {
      g_StatusMsg.innerText       = "Playing";
      g_AudioPlayer.style.display = "block";
    })
    .catch((error) => {
      console.error("Error playing audio:", error);
      g_StatusMsg.innerText = "Error playing audio";
    });
}

//
// Api Calls
//

// -----------------------------------------------------------------------------
async function _CallDownloadApi()
{
  const youtubeUrl = g_YoutubeUrl;
  const encoded    = encodeURIComponent(youtubeUrl);
  const url        = `${DOWNLOAD_ENDPOINT}${encoded}`;

  try {
    const event_source = new EventSource(url);
    //
    event_source.onmessage = (event) => {
      //
      g_StatusMsg.innerText       = event.data;
      g_ProgressBar.style.cssText = `width: 20%`;
    };

    //
    event_source.onerror = (err) => {
      g_StatusMsg.innerText = "ERROR: " + JSON.stringify(err);
      event_source.close();
      _SetAudioStream(youtubeUrl);
    };

    //
    event_source.onopen = () => {
      //
      console.log('Connection opened');
    };

    //
    event_source.onclose = () => {
      console.log('Connection closed');
      _SetAudioStream(youtubeUrl);
    };
  }
  catch (err) {
    console.log(err);
  }
}

// -----------------------------------------------------------------------------
async function _OnDownloadApiCallDidFinish()
{
  g_FetchButton.innerText         = "Fetch again...";
  g_FetchButton.className         = "";
  g_DownloadMusicButton.className = "";
  g_DownloadVideoButton.className = "";
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
