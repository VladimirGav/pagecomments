function getPageDetails(callback) {
    chrome.runtime.onMessage.addListener(function(message)  {
        callback(message);
    });
}