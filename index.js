const gaulesComecouURL =
  "https://www.myinstants.com/media/sounds/esl-pro-league-season-11-north-america-mibr-vs-furia-mapa-iii-mirage-mp3cut.mp3";
const qOtaUrl = "https://www.myinstants.com/media/sounds/que-ota_-17.mp3";
const birlUrl = "https://www.myinstants.com/media/sounds/birl.mp3";

const gaulesAudio = new Audio(gaulesComecouURL);
const qotaAudio = new Audio(qOtaUrl);
const birlAudio = new Audio(birlUrl);

[gaulesAudio, qotaAudio, birlAudio].forEach((audio) => (audio.volume = 0.3));

const startButton = document.getElementById("start");
const qotaButton = document.getElementById("qota");

const parseTime = ({ goal, elapsed }) => {
  const rest = goal - elapsed;
  const hours = (rest / 3600) >> 0;
  const minutes = ((rest % 3600) / 60) >> 0;
  const seconds = rest % 60;

  return { hours, minutes, seconds };
};

// "3" -> "03"
// "22" -> "22"
const padding = (str) => ("0" + str.toString()).slice(-2);

//
// Timer View
//
const minWrapper = document.getElementById("minutes");
const secWrapper = document.getElementById("seconds");
const hourWrapper = document.getElementById("hours");

const renderTimer = ({ goal, elapsed }) => {
  const { hours, minutes, seconds } = parseTime({ goal, elapsed });
  const paddingMinutes = padding(minutes);
  const paddingSeconds = padding(seconds);
  hourWrapper.innerHTML = hours;
  minWrapper.innerHTML = paddingMinutes;
  secWrapper.innerHTML = paddingSeconds;
  document.title = [hours, paddingMinutes, paddingSeconds]
    .map((el) => el.toString())
    .join(":");
};

//
// Worker
//
let worker = new Worker("worker.js");

const makeWorkerListener = (goal) => (event) => {
  renderTimer({ goal, elapsed: Math.min(event.data, goal) });
  if (goal - event.data <= 0) {
    timerMachine({ type: TIMER_END, msg: goal });
  }
};

//
// APP MSGS
//
const START_CLICK = Symbol();
const QOTA_CLICK = Symbol();
const TIME_SELECT = Symbol();

//
// TIMER MSGS
//
const TIMER_RESTART = Symbol();
const TIMER_RESET = Symbol();
const TIMER_END = Symbol();
const TIMER_PAUSE = Symbol();

//
// INITIAL STATE
//
const makeGoal = (t) => t * 60;
const INITIAL_GOAL = makeGoal(45);

let State = {
  goal: INITIAL_GOAL,
  workerListener: makeWorkerListener(INITIAL_GOAL)
};
Object.freeze(State);
// Set initial timer
renderTimer({ goal: INITIAL_GOAL, elapsed: 0 });

// Set worker listener timer
worker.addEventListener("message", State.workerListener);

//
// MAIN STATE MACHINE
//
const machine = (state, event) => {
  const { type, msg } = event;

  switch (type) {
    case START_CLICK:
      gaulesAudio.play();
      return {
        nextState: state,
        runEffect: (nextState) => {
          timerMachine({ type: TIMER_RESTART, msg: nextState.goal });
        }
      };

    case QOTA_CLICK:
      qotaAudio.play();
      return {
        nextState: state,
        runEffect: (nextState) => {
          timerMachine({ type: TIMER_RESTART, msg: nextState.goal });
        }
      };

    case TIME_SELECT:
      const goal = makeGoal(msg);
      const workerListener = makeWorkerListener(goal);

      return {
        nextState: { ...state, goal, workerListener },
        runEffect: (nextState) => {
          // updating the worker listener
          worker.removeEventListener("message", state.workerListener);
          worker.addEventListener("message", workerListener);

          timerMachine({ type: TIMER_RESET, msg: nextState.goal });
        }
      };
    default:
      return { nextState: State };
  }
};

const machineSend = (event) => {
  const { nextState, runEffect } = machine(State, event);
  // State assignment only in this function :)
  State = nextState;
  Object.freeze(State);
  console.info({ State });
  if (runEffect) {
    runEffect(State);
  }
};

// Only the timer effects
const timerMachine = (event) => {
  const { type, msg } = event;
  switch (type) {
    case TIMER_RESTART:
      timerMachine({ type: TIMER_RESET, msg });
      worker.postMessage({ type: "START", goal: msg });
      break;

    case TIMER_RESET:
      worker.postMessage({ type: "STOP" });
      renderTimer({ goal: msg, elapsed: 0 });
      break;

    case TIMER_PAUSE:
      worker.postMessage({ type: "STOP" });
      break;

    case TIMER_END:
      worker.postMessage({ type: "STOP" });
      birlAudio.play();
      break;

    default:
      timerMachine({ type: TIMER_RESET });
  }
};

// Button Events
startButton.addEventListener("click", () => {
  machineSend({ type: START_CLICK });
});
qotaButton.addEventListener("click", () => {
  machineSend({ type: QOTA_CLICK });
});

const timesContainer = document.getElementById("times");
const onClickTime = (time) => (domEvent) => {
  const currentElem = domEvent.currentTarget;
  if (currentElem.classList.contains("selected")) {
    return;
  }
  Array.from(timesContainer.querySelectorAll("div.selected")).forEach((el) => {
    el.classList.remove("selected");
  });
  currentElem.classList.add("selected");

  // Selecting a time
  machineSend({ type: TIME_SELECT, msg: time });
};

//
// Render the times
//
const times = [5, 15, 25, 35, 45];
const initialTimeIndex = 4;

// Vanilla >>>>>>>>>>>>>>>>>>> React
times.forEach((el, i) => {
  const div = document.createElement("div");
  div.innerText = el.toString();
  div.onclick = onClickTime(times[i]);
  if (i === initialTimeIndex) {
    div.classList.add("selected");
  }
  timesContainer.appendChild(div);
});
