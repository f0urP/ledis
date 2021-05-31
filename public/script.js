const cmdHistory = [];
let cmdHistoryIndex = 0;
const cmdInput = document.getElementById("cmd-input");
const stream = document.getElementById("stream");
const ldedisCli = document.getElementById("ledis-cli");
ldedisCli.addEventListener("click", () => {
  cmdInput.focus();
})
const appendStream = value => {
  stream.innerHTML += `<p>${value}</p>`;
};
cmdInput.addEventListener("keyup", event => {
  event.preventDefault();
  switch (event.key) {
    case 'Enter':
      appendStream(`> ${cmdInput.value}`)
      if (cmdInput.value) {
        cmdHistoryIndex = cmdHistory.push(cmdInput.value);
        const args = cmdInput.value.match(/\w+|'[^']+'|"[^"]+"/g).map(str => str.replace(/"|'/g, ''));
        executeCmd(args[0], args.slice(1));
        cmdInput.value = ''
      }
      break;
    case 'ArrowUp':
      cmdHistoryIndex = cmdHistoryIndex - 1 < 0 ? 0 : cmdHistoryIndex - 1;
      cmdInput.value = cmdHistory[cmdHistoryIndex] || '';
      break;
    case 'ArrowDown':
      cmdHistoryIndex = cmdHistoryIndex + 1 > cmdHistory.length - 1 ? cmdHistory.length - 1 : cmdHistoryIndex + 1;
      cmdInput.value = cmdHistory[cmdHistoryIndex] || '';
      break;
  }
})
const showResponse = responseText => {
  try {
    const response = JSON.parse(responseText);
    if (response && response.result) {
      if (Array.isArray(response.result)) {
        if (response.result.length > 0) {
          response.result.map(element => appendStream(element));
        } else {
          appendStream('empty array')
        }
      } else {
        appendStream(response.result);
      }
    } else {
      appendStream('null')
    }
  } catch {
    appendStream(responseText)
  }
}
const executeCmd = (operator, args) => {
  const request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (this.readyState == 4) {
      showResponse(this.responseText);
    }
  };
  request.open("POST", "/", true);
  request.setRequestHeader("Content-Type", "application/json");
  request.send(JSON.stringify({ operator, args }));

}