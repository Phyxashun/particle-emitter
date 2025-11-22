import Context from "../renderer/Context";
import { DefaultOptions, EmitterOptions } from "./Options";
import Emitter from "./Emitter";
import Utility from '../utils/Utility';
//import { ScreenBounds, RectBounds, CircleBounds } from "../shapes/Obstacle";

let lastTime: number = Utility.now();
const ctx: Context = new Context();
Constants.updateDimensions(ctx);

const options = new DefaultOptions();
const emitterOptions = new EmitterOptions(options);
let emitter = new Emitter(emitterOptions);

//const bounds = [
//  new ScreenBounds(0, 0, Constants.WIDTH, Constants.HEIGHT),
//  new RectBounds(Constants.CENTER.x - 150, Constants.CENTER.y - 50, 300, 100),
//  new CircleBounds(Constants.CENTER.x + 200, Constants.CENTER.y, 80)
//];

emitter.addParticles();

ctx.startAnimation((timeStamp) => {
  const dt = (timeStamp - lastTime) / 1000;
  lastTime = timeStamp;

  ctx.clear();
  emitter.addParticles();
  emitter.run(ctx, dt);
});