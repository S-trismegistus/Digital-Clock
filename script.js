// Fetch internet time (synchronized)
async function fetchInternetTime() {
  try {
    const resp = await fetch('https://worldtimeapi.org/api/ip');
    const data = await resp.json();
    return new Date(data.datetime);
  } catch (e) {
    console.warn('Internet time failed, falling back to local time.', e);
    return new Date();
  }
}

async function initClock() {
  let currentTime = await fetchInternetTime();

  const clock = document.getElementById('clock');
  const marksContainer = document.getElementById('marks');
  const dateDisplay = document.getElementById('dateDisplay');

  const hourHand = document.getElementById('hourHand');
  const minuteHand = document.getElementById('minuteHand');
  const secondHand = document.getElementById('secondHand');

  // helper: compute center & sizes
  function computeSizes() {
    const rect = clock.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const radius = Math.min(cx, cy);
    return { rect, cx, cy, radius };
  }

  // clear previous marks (if any) and (re)build ticks + numbers precisely using polar coords
  function buildMarksAndNumbers() {
    marksContainer.innerHTML = '';
    const { radius } = computeSizes();

    // ticks: 60 marks
    for (let i = 0; i < 60; i++) {
      const angleDeg = i * 6 - 90; // start from top
      const angleRad = angleDeg * Math.PI / 180;

      const isHour = i % 5 === 0;
      const markLength = isHour ? Math.max(12, Math.round(radius * 0.12)) : Math.max(7, Math.round(radius * 0.07));
      const markThickness = isHour ? Math.max(3, Math.round(radius * 0.018)) : Math.max(2, Math.round(radius * 0.01));

      // distance from center to the center of the mark (so mark sits inside the rim)
      const distance = radius - (markLength / 2) - Math.max(6, Math.round(radius * 0.02));

      const x = Math.cos(angleRad) * distance;
      const y = Math.sin(angleRad) * distance;

      const mark = document.createElement('div');
      mark.className = 'mark';
      mark.style.width = `${markThickness}px`;
      mark.style.height = `${markLength}px`;

      // position center of mark at (50% + x, 50% + y)
      mark.style.left = `calc(50% + ${x}px)`;
      mark.style.top = `calc(50% + ${y}px)`;

      // rotate the mark so it radiates outward (mark element's height is along the radial direction)
      mark.style.transform = `translate(-50%,-50%) rotate(${angleDeg + 90}deg)`;
      if (isHour) mark.style.background = '#000';
      marksContainer.appendChild(mark);
    }

    // numbers 1-12: place slightly inside the hour marks
    for (let n = 1; n <= 12; n++) {
      const angleDeg = n * 30 - 90;
      const angleRad = angleDeg * Math.PI / 180;
      // place numbers a bit closer to center than ticks
      const numberRadius = radius - Math.max(36, Math.round(radius * 0.22));
      const x = Math.cos(angleRad) * numberRadius;
      const y = Math.sin(angleRad) * numberRadius;

      const num = document.createElement('div');
      num.className = 'number';
      num.textContent = n;

      // size the font responsively
      const fontSize = Math.max(12, Math.round(radius * 0.12));
      num.style.fontSize = `${fontSize}px`;
      num.style.left = `calc(50% + ${x}px)`;
      num.style.top = `calc(50% + ${y}px)`;
      num.style.transform = 'translate(-50%,-50%)';
      marksContainer.appendChild(num);
    }
  }

  // scale hand lengths relative to clock radius and set initial styles
  function scaleHands() {
    const { radius } = computeSizes();

    const hourLen = Math.round(radius * 0.45);
    const minuteLen = Math.round(radius * 0.66);
    const secondLen = Math.round(radius * 0.82);

    hourHand.style.height = `${hourLen}px`;
    minuteHand.style.height = `${minuteLen}px`;
    secondHand.style.height = `${secondLen}px`;

    // horizontally center each hand: width already set in CSS, so we translate by -50% in JS transform when rotating
    // but we leave transform to the rotation setter to avoid conflicts
  }
const centerDot = document.querySelector('.center-dot');

  // update clock hands using currentTime (we increment locally each second; re-sync could be added)
  function updateClockHands() {
    // increment the base time by 1 second
    currentTime.setSeconds(currentTime.getSeconds() + 1);

    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();

    // degrees
    const hourDeg = (hours % 12) * 30 + (minutes / 60) * 30 + (seconds / 3600) * 30;
    const minuteDeg = minutes * 6 + (seconds / 60) * 6;
    const secondDeg = seconds * 6;

    // rotate while keeping horizontal centering via translateX(-50%)
    hourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
    minuteHand.style.transform = `translateX(-50%) rotate(${minuteDeg}deg)`;
    secondHand.style.transform = `translateX(-50%) rotate(${secondDeg}deg)`;

    centerDot.style.transform = `translate(-50%, -50%) rotate(${secondDeg}deg)`;

    // update date string
    const options = { weekday:'short', month:'short', day:'numeric', year:'numeric' };
    document.getElementById('dateDisplay').textContent = currentTime.toLocaleDateString(undefined, options);
  }

  // initial build + scale
  buildMarksAndNumbers();
  scaleHands();
  updateClockHands();

  // tick every second
  let tickInterval = setInterval(updateClockHands, 1000);

  // if the window resizes, rebuild marks/numbers and rescale hands so everything stays aligned
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    clearInterval(tickInterval);
    resizeTimer = setTimeout(() => {
      buildMarksAndNumbers();
      scaleHands();
      // re-run one immediate update so hands are in sync visually
      updateClockHands();
      tickInterval = setInterval(updateClockHands, 1000);
    }, 120);
  });
}

initClock();
