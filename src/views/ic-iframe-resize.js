function post_iframe_size() {
  if (parent.postMessage) {
    const height = document.documentElement.offsetHeight + 20;
    parent.postMessage(height, '*');
  }
}
