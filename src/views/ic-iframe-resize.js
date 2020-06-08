function post_iframe_size() {
  if (parent.postMessage)
    parent.postMessage(document.documentElement.offsetHeight, '*');
}
