import {
  task,
  wait
} from "../../chunk-NSHEPB4R.mjs";
import {
  logger
} from "../../chunk-2DX3IXDA.mjs";
import "../../chunk-DE4ZXXWG.mjs";
import "../../chunk-PFMI3Y4O.mjs";
import "../../chunk-IZXRM6R5.mjs";
import {
  __name,
  init_esm
} from "../../chunk-VWGL725N.mjs";

// trigger/example.ts
init_esm();
var helloWorldTask = task({
  id: "hello-world",
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300,
  // Stop executing after 300 secs (5 mins) of compute
  run: /* @__PURE__ */ __name(async (payload, { ctx }) => {
    logger.log("Hello, world!", { payload, ctx });
    await wait.for({ seconds: 5 });
    return {
      message: "Hello, world!"
    };
  }, "run")
});
export {
  helloWorldTask
};
//# sourceMappingURL=example.mjs.map
