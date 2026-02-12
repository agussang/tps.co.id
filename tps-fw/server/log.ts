const config = {
  _now: 0,
};
export const log = {
  start() {
    config._now = Date.now();
  },
  now(text: string) {
    const pad = "              ";
    const time = Date.now() - config._now;
    console.log((time + pad).slice(0, 13), text);
  }, 
}; 
