function onCreated(windowInfo) {
    console.log(`Created window: ${windowInfo.id}`);
  }
  
  function onError(error) {
    console.log(`Error: ${error}`);
  }
  
  browser.browserAction.onClicked.addListener((tab) => {
  
    var popupURL = browser.extension.getURL("test.html");
  
    var creating = browser.windows.create({
      url: popupURL,
      type: "popup",
      height: 200,
      width: 200
    });
    creating.then(onCreated, onError);
  
  });