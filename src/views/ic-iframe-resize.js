function post_iframe_size() {
  if (parent.postMessage) {
    const container = document.getElementById('ic-iframe-container');
    const height = container.scrollHeight + 14; // 14 comes from visual essay
    parent.postMessage(height, '*');
  }
}
