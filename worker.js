let tickTimer;

onmessage = function (event) {
  let data = event.data;
  let base = 0;
  if (data.type === "STOP") {
    clearTimeout(tickTimer);
    base = 0;
    console.info("stop!");
  } else {
    console.info("started!");
    base = +new Date();
    const tick = () => {
      const current = +new Date();
      postMessage(((current - base) / 1000) >> 0);
      tickTimer = setTimeout(tick, 1000);
    };
    tick();
  }
};
