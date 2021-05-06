let tickTimer;
let base = 0;
let goal = 0; // in milli
onmessage = function (event) {
  let data = event.data;

  if (data.type === "STOP") {
    clearTimeout(tickTimer);
    base = 0;
    goal = 0;
    console.info("stoped!");
  } else if (data.type === "START") {
    base = performance.now();
    goal = data.goal;
    tickTimer = setInterval(() => {
      const current = performance.now();
      const diff = ((current - base) / 1000) >> 0;

      postMessage(diff);

      // just for security :)
      if (diff > goal) {
        clearInterval(tickTimer);
        console.info("goal!");
      }
    }, 1000);
    console.info("started!");
  }
};
