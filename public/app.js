//
// Elements
//

// -----------------------------------------------------------------------------
const g_YoutubeUrlInput = document.getElementById("youtubeInput");
const g_AudioPlayer = document.getElementById("audioPlayer");
const g_MediaCover = document.getElementById("mediaCover");
const g_FetchButton = document.getElementById("playBtn");
const g_DownloadMusicButton = document.getElementById("downloadMusicButton");
const g_DownloadVideoButton = document.getElementById("downloadVideoButton");
const g_ProgressBar = document.getElementById("progressBar");
//
// Constants
//

// -----------------------------------------------------------------------------
const baseUrl = window.location;
// -----------------------------------------------------------------------------
const STREAM_ENDPOINT = `${baseUrl}api/stream/`;
const INFO_ENDPOINT = `${baseUrl}api/info/`;
const DOWNLOAD_VIDEO_ENDPOINT = `${baseUrl}api/download-video/`;
const CONVERT_VIDEO_ENDPOINT = `${baseUrl}api/convert-video/`;
const DOWNLOAD_LINK = `${baseUrl}_download/`;

//
// Globals
//

// -----------------------------------------------------------------------------
let g_YoutubeUrl = "https://www.youtube.com/watch?v=wB7FXxNLH6g";
let g_InfoData = null;

// -----------------------------------------------------------------------------
function _IsAnPossibleValidYoutubeUrl(url) {
  const pattern = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/;
  return pattern.test(url);
}

//
// UI Handlers
//

function _CreateLoadingSpinner() {
  return `
  <div class="lds-facebook">
    <div></div>
    <div></div>
    <div></div>
  </div>
  `;
}


function _SetStateToReadyToFetchData() {
  g_FetchButton.innerHTML = "Fetch info";// + _CreateLoadingSpinner();
  g_FetchButton.className = "";

  g_DownloadMusicButton.className = (g_InfoData?.audioExists) ? "" : "buttonDisabled";
  g_DownloadVideoButton.className = (g_InfoData?.videoExists) ? "" : "buttonDisabled";

}

function _SetStateToFetchingData() {
  g_FetchButton.innerHTML = "Fetching info" + _CreateLoadingSpinner();
  g_FetchButton.className = "buttonDisabled";
  g_DownloadMusicButton.className = "buttonDisabled";
  g_DownloadVideoButton.className = "buttonDisabled";
}

function _SetStateToDownloadingVideo() {
  g_FetchButton.innerHTML = "Downloading video" + _CreateLoadingSpinner();
  g_FetchButton.className = "buttonDownloading";
  g_DownloadMusicButton.className = "buttonDisabled";
  g_DownloadVideoButton.className = "buttonDisabled";
}

function _SetStateToConvertingVideo() {
  g_FetchButton.innerHTML = "Converting video" + _CreateLoadingSpinner();
  g_FetchButton.className = "buttonConverting";

  g_DownloadVideoButton.className = "";
}

// -----------------------------------------------------------------------------
async function _OnStartFetchDataButtonClicked() {
  try {
    //
    g_YoutubeUrl = g_YoutubeUrlInput.value || g_YoutubeUrl;
    g_YoutubeUrlInput.value = g_YoutubeUrl;

    _SetStateToFetchingData();

    // Try to get the video info...
    const info_response = await fetch(`${INFO_ENDPOINT}${g_YoutubeUrl}`);
    if (info_response.status != 200) {
      _ShowErrorToast({
        message: "Error fetching video info",
      });

      _SetStateToReadyToFetchData();
      return null;
    }

    // Parse the date in json format
    const json = await info_response.json();
    g_InfoData = json.payload;

    // Update UI.
    _SetCoverImage();

    g_FetchButton.className = "";
    g_FetchButton.innerText = "Fetch again...";

    // Video exists -- Unlock the button...
    if (g_InfoData.videoExists) {
      g_DownloadVideoButton.className = "";

      // Audio exists -- Unlock the button...
      if (g_InfoData.audioExists) {
        g_DownloadMusicButton.className = "";
        _SetAudioStream();
      } else {
        _OnDownloadVideoApiCallDidFinish()
      }
    }
    // Video not exits -- Call api to download it.
    else {
      _SetStateToDownloadingVideo();
      _CallDownloadVideoApi();
    }
  }
  catch (error) {
    console.error("Error fetching video info:", error);
    _ShowErrorToast({
      message: "Error fetching video info - " + error.message,
    });

    _SetStateToReadyToFetchData();
    return null;
  }
}

// -----------------------------------------------------------------------------
function _OnDownloadMusicButtonClicked() {
  const url = `${DOWNLOAD_LINK}/${g_InfoData.audioFilename}`;
  const link = document.createElement("a");
  link.href = url;
  // link.download = url.split("/").pop(); // Extracts the file name from the URL
  link.target = "_blank";
  link.click();
}
// -----------------------------------------------------------------------------
function _OnDownloadVideoButtonClicked() {
  const url = `${DOWNLOAD_LINK}/${g_InfoData.videoFilename}`;
  const link = document.createElement("a");
  link.href = url;
  // link.download = url.split("/").pop(); // Extracts the file name from the URL
  link.target = "_blank";
  link.click();
}

//
// Helpers
//

// -----------------------------------------------------------------------------
function _SetCoverImage() {
  data = g_InfoData;

  const thumbnail =
    data.info?.player_response?.videoDetails?.thumbnail?.thumbnails?.pop()?.url;
  g_MediaCover.src = thumbnail || "";

  g_MediaCover.onload = () => { g_MediaCover.style.display = "block"; };
}

// -----------------------------------------------------------------------------
function _SetAudioStream() {
  const youtubeUrl = g_YoutubeUrl;
  g_AudioPlayer.src = `${STREAM_ENDPOINT}${youtubeUrl}`;
  g_AudioPlayer.play()
    .then(() => { g_AudioPlayer.style.display = "block"; })
    .catch((error) => { console.error("Error playing audio:", error); });
}

//
// Api Calls
//


// -----------------------------------------------------------------------------
async function _CallFetchInfoApi() {
}

// -----------------------------------------------------------------------------
async function _CallDownloadVideoApi() {
  const youtubeUrl = g_YoutubeUrl;
  const encoded = encodeURIComponent(youtubeUrl);
  const url = `${DOWNLOAD_VIDEO_ENDPOINT}${encoded}`;

  try {
    const event_source = new EventSource(url);
    //
    event_source.onerror = (err) => {
      _ShowErrorToast({
        message: "Error Downloading video data - " + err.message,
      });

      event_source.close();
      g_InfoData.videoExists = false;
      _SetStateToReadyToFetchData();
    };

    //
    event_source.onclose = () => {
      g_InfoData.videoExists = true;
      _OnDownloadVideoApiCallDidFinish();
    };
  }
  catch (err) {
    _ShowErrorToast({
      message: "Error Downloading video - " + err.message,
    });


    g_InfoData.videoExists = false;
    _SetStateToReadyToFetchData();
  }
}

// -----------------------------------------------------------------------------
async function _OnDownloadVideoApiCallDidFinish() {
  _SetStateToConvertingVideo();
  _CallConvertVideoApi();
}

// -----------------------------------------------------------------------------
async function _CallConvertVideoApi() {
  const youtubeUrl = g_YoutubeUrl;
  const encoded = encodeURIComponent(youtubeUrl);
  const url = `${CONVERT_VIDEO_ENDPOINT}${encoded}`;

  try {
    const event_source = new EventSource(url);
    event_source.onerror = (err) => {
      _ShowErrorToast({
        message: "Error Converting video data- " + err.message,
      });

      event_source.close();
      g_InfoData.audioExists = false;
      _SetStateToReadyToFetchData();
    };

    //
    event_source.onclose = () => {
      g_InfoData.audioExists = true;
      _OnConvertVideoApiCallDidFinish();
    };
  }
  catch (err) {
    _ShowErrorToast({
      message: "Error Converting video - " + err.message,
    });

    g_InfoData.audioExists = false;
    _SetStateToReadyToFetchData();
  }
}
// -----------------------------------------------------------------------------
function _OnConvertVideoApiCallDidFinish() {
  g_DownloadMusicButton.className = "";

  g_FetchButton.innerText = "Fetch again...";
  g_FetchButton.className = "";

  _SetAudioStream();
}


//
// Toast
//
async function _ShowErrorToast({ message }) {
  debugger;
  Toastify({
    text: message,
    duration: 2000,
    // destination: "https://github.com/apvarun/toastify-js",
    // newWindow: true,
    close: true,
    gravity: "top", // `top` or `bottom`
    position: "left", // `left`, `center` or `right`
    // stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
      background: "linear-gradient(to right, #00b09b, #96c93d)",
    },

    onClick: function () { } // Callback after click
  }).showToast();
}
//
// Entry Point
//

// -----------------------------------------------------------------------------
g_FetchButton.addEventListener("click",
  () => { _OnStartFetchDataButtonClicked() });
g_DownloadMusicButton.addEventListener("click",
  () => { _OnDownloadMusicButtonClicked() });
g_DownloadVideoButton.addEventListener("click",
  () => { _OnDownloadVideoButtonClicked() });


_SetStateToReadyToFetchData();