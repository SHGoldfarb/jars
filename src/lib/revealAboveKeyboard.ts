// How long to wait for an on-screen keyboard to start opening, or resizing, after an input takes
// focus. When nothing resizes in that time the keyboard was already up at its final size.
const KEYBOARD_START_MS = 300;
// How long the viewport has to stay still after a resize before the keyboard counts as settled.
// It animates in, firing a resize per step.
const KEYBOARD_SETTLE_MS = 100;

// Scrolls a just-focused element back into sight once a phone's on-screen keyboard has settled.
//
// A browser scrolls a focused input into view as the focus lands, but not again when the
// keyboard that focus brings up then covers it - nor when the keyboard grows, as it does going
// from a numeric field to a text field with a suggestion bar. That leaves the caret typing
// under the keyboard. The visual viewport is what the keyboard shrinks, so this waits on its
// resizes and then checks the element against what is still visible.
export const revealAboveKeyboard = (element: HTMLElement): void => {
  const viewport = window.visualViewport;
  if (!viewport) {
    return;
  }

  let timer: ReturnType<typeof setTimeout> | undefined;

  const stop = () => {
    clearTimeout(timer);
    viewport.removeEventListener('resize', onResize);
    element.removeEventListener('blur', stop);
  };

  const reveal = () => {
    stop();
    const rect = element.getBoundingClientRect();
    const visibleTop = viewport.offsetTop;
    const visibleBottom = viewport.offsetTop + viewport.height;
    if (rect.top < visibleTop || rect.bottom > visibleBottom) {
      element.scrollIntoView({ block: 'center' });
    }
  };

  const onResize = () => {
    clearTimeout(timer);
    timer = setTimeout(reveal, KEYBOARD_SETTLE_MS);
  };

  viewport.addEventListener('resize', onResize);
  // Leaving the field before the keyboard settles means there is nothing left to reveal.
  element.addEventListener('blur', stop);
  timer = setTimeout(reveal, KEYBOARD_START_MS);
};
