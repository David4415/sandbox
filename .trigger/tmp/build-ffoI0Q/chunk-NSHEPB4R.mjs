import {
  ManualWaitpointPromise,
  SemanticInternalAttributes,
  SpanStatusCode,
  WaitpointTimeoutError,
  accessoryAttributes,
  apiClientManager,
  conditionallyImportAndParsePacket,
  createTask,
  flattenAttributes,
  init_esm as init_esm2,
  mergeRequestOptions,
  runtime,
  taskContext,
  tracer
} from "./chunk-2DX3IXDA.mjs";
import {
  __name,
  init_esm
} from "./chunk-VWGL725N.mjs";

// node_modules/@trigger.dev/sdk/dist/esm/v3/config.js
init_esm();
function defineConfig(config) {
  return config;
}
__name(defineConfig, "defineConfig");

// node_modules/@trigger.dev/sdk/dist/esm/v3/wait.js
init_esm();
init_esm2();
function createToken(options, requestOptions) {
  const apiClient = apiClientManager.clientOrThrow();
  const $requestOptions = mergeRequestOptions({
    tracer,
    name: "wait.createToken()",
    icon: "wait-token",
    attributes: {
      idempotencyKey: options?.idempotencyKey,
      idempotencyKeyTTL: options?.idempotencyKeyTTL,
      timeout: options?.timeout ? typeof options.timeout === "string" ? options.timeout : options.timeout.toISOString() : void 0,
      tags: options?.tags
    },
    onResponseBody: /* @__PURE__ */ __name((body, span) => {
      span.setAttribute("id", body.id);
      span.setAttribute("isCached", body.isCached);
      span.setAttribute("url", body.url);
    }, "onResponseBody")
  }, requestOptions);
  return apiClient.createWaitpointToken(options ?? {}, $requestOptions);
}
__name(createToken, "createToken");
function listTokens(params, requestOptions) {
  const apiClient = apiClientManager.clientOrThrow();
  const $requestOptions = mergeRequestOptions({
    tracer,
    name: "wait.listTokens()",
    icon: "wait-token",
    attributes: {
      ...flattenAttributes(params)
    }
  }, requestOptions);
  return apiClient.listWaitpointTokens(params, $requestOptions);
}
__name(listTokens, "listTokens");
async function retrieveToken(token, requestOptions) {
  const apiClient = apiClientManager.clientOrThrow();
  const $tokenId = typeof token === "string" ? token : token.id;
  const $requestOptions = mergeRequestOptions({
    tracer,
    name: "wait.retrieveToken()",
    icon: "wait-token",
    attributes: {
      id: $tokenId,
      ...accessoryAttributes({
        items: [
          {
            text: $tokenId,
            variant: "normal"
          }
        ],
        style: "codepath"
      })
    },
    onResponseBody: /* @__PURE__ */ __name((body, span) => {
      span.setAttribute("id", body.id);
      span.setAttribute("url", body.url);
      span.setAttribute("status", body.status);
      if (body.completedAt) {
        span.setAttribute("completedAt", body.completedAt.toISOString());
      }
      if (body.timeoutAt) {
        span.setAttribute("timeoutAt", body.timeoutAt.toISOString());
      }
      if (body.idempotencyKey) {
        span.setAttribute("idempotencyKey", body.idempotencyKey);
      }
      if (body.idempotencyKeyExpiresAt) {
        span.setAttribute("idempotencyKeyExpiresAt", body.idempotencyKeyExpiresAt.toISOString());
      }
      span.setAttribute("tags", body.tags);
      span.setAttribute("createdAt", body.createdAt.toISOString());
    }, "onResponseBody")
  }, requestOptions);
  const result = await apiClient.retrieveWaitpointToken($tokenId, $requestOptions);
  const data = result.output ? await conditionallyImportAndParsePacket({ data: result.output, dataType: result.outputType ?? "application/json" }, apiClient) : void 0;
  let error = void 0;
  let output = void 0;
  if (result.outputIsError) {
    error = new WaitpointTimeoutError(data.message);
  } else {
    output = data;
  }
  return {
    id: result.id,
    url: result.url,
    status: result.status,
    completedAt: result.completedAt,
    timeoutAt: result.timeoutAt,
    idempotencyKey: result.idempotencyKey,
    idempotencyKeyExpiresAt: result.idempotencyKeyExpiresAt,
    tags: result.tags,
    createdAt: result.createdAt,
    output,
    error
  };
}
__name(retrieveToken, "retrieveToken");
async function completeToken(token, data, requestOptions) {
  const apiClient = apiClientManager.clientOrThrow();
  const tokenId = typeof token === "string" ? token : token.id;
  const $requestOptions = mergeRequestOptions({
    tracer,
    name: "wait.completeToken()",
    icon: "wait-token",
    attributes: {
      id: tokenId
    },
    onResponseBody: /* @__PURE__ */ __name((body, span) => {
      span.setAttribute("success", body.success);
    }, "onResponseBody")
  }, requestOptions);
  return apiClient.completeWaitpointToken(tokenId, { data }, $requestOptions);
}
__name(completeToken, "completeToken");
var DURATION_WAIT_CHARGE_THRESHOLD_MS = 5e3;
function printWaitBelowThreshold() {
  console.warn(`Waits of ${DURATION_WAIT_CHARGE_THRESHOLD_MS / 1e3}s or less count towards compute usage.`);
}
__name(printWaitBelowThreshold, "printWaitBelowThreshold");
var wait = {
  for: /* @__PURE__ */ __name(async (options) => {
    const ctx = taskContext.ctx;
    if (!ctx) {
      throw new Error("wait.forToken can only be used from inside a task.run()");
    }
    const apiClient = apiClientManager.clientOrThrow();
    const start = Date.now();
    const durationInMs = calculateDurationInMs(options);
    if (durationInMs <= DURATION_WAIT_CHARGE_THRESHOLD_MS) {
      return tracer.startActiveSpan(`wait.for()`, async (span) => {
        if (durationInMs <= 0) {
          return;
        }
        printWaitBelowThreshold();
        await new Promise((resolve) => setTimeout(resolve, durationInMs));
      }, {
        attributes: {
          [SemanticInternalAttributes.STYLE_ICON]: "wait",
          ...accessoryAttributes({
            items: [
              {
                text: nameForWaitOptions(options),
                variant: "normal"
              }
            ],
            style: "codepath"
          })
        }
      });
    }
    const date = new Date(start + durationInMs);
    const result = await apiClient.waitForDuration(ctx.run.id, {
      date,
      idempotencyKey: options.idempotencyKey,
      idempotencyKeyTTL: options.idempotencyKeyTTL
    });
    return tracer.startActiveSpan(`wait.for()`, async (span) => {
      await runtime.waitUntil(result.waitpoint.id, date);
    }, {
      attributes: {
        [SemanticInternalAttributes.STYLE_ICON]: "wait",
        [SemanticInternalAttributes.ENTITY_TYPE]: "waitpoint",
        [SemanticInternalAttributes.ENTITY_ID]: result.waitpoint.id,
        ...accessoryAttributes({
          items: [
            {
              text: nameForWaitOptions(options),
              variant: "normal"
            }
          ],
          style: "codepath"
        })
      }
    });
  }, "for"),
  until: /* @__PURE__ */ __name(async (options) => {
    const ctx = taskContext.ctx;
    if (!ctx) {
      throw new Error("wait.forToken can only be used from inside a task.run()");
    }
    const durationInMs = options.date.getTime() - Date.now();
    if (durationInMs <= DURATION_WAIT_CHARGE_THRESHOLD_MS) {
      return tracer.startActiveSpan(`wait.for()`, async (span) => {
        if (durationInMs === 0) {
          return;
        }
        if (durationInMs < 0) {
          if (options.throwIfInThePast) {
            throw new Error("Date is in the past");
          }
          return;
        }
        printWaitBelowThreshold();
        await new Promise((resolve) => setTimeout(resolve, durationInMs));
      }, {
        attributes: {
          [SemanticInternalAttributes.STYLE_ICON]: "wait",
          ...accessoryAttributes({
            items: [
              {
                text: options.date.toISOString(),
                variant: "normal"
              }
            ],
            style: "codepath"
          })
        }
      });
    }
    const apiClient = apiClientManager.clientOrThrow();
    const result = await apiClient.waitForDuration(ctx.run.id, {
      date: options.date,
      idempotencyKey: options.idempotencyKey,
      idempotencyKeyTTL: options.idempotencyKeyTTL
    });
    return tracer.startActiveSpan(`wait.until()`, async (span) => {
      if (options.throwIfInThePast && options.date < /* @__PURE__ */ new Date()) {
        throw new Error("Date is in the past");
      }
      await runtime.waitUntil(result.waitpoint.id, options.date);
    }, {
      attributes: {
        [SemanticInternalAttributes.STYLE_ICON]: "wait",
        [SemanticInternalAttributes.ENTITY_TYPE]: "waitpoint",
        [SemanticInternalAttributes.ENTITY_ID]: result.waitpoint.id,
        ...accessoryAttributes({
          items: [
            {
              text: options.date.toISOString(),
              variant: "normal"
            }
          ],
          style: "codepath"
        })
      }
    });
  }, "until"),
  createToken,
  listTokens,
  completeToken,
  retrieveToken,
  /**
   * This waits for a waitpoint token to be completed.
   * It can only be used inside a task.run() block.
   *
   * @example
   *
   * ```ts
   * const result = await wait.forToken<typeof ApprovalData>(token);
   * if (!result.ok) {
   *   // The waitpoint timed out
   *   throw result.error;
   * }
   *
   * // This will be the type ApprovalData
   * const approval = result.output;
   * ```
   *
   * @param token - The token to wait for.
   * @param options - The options for the waitpoint token.
   * @returns A promise that resolves to the result of the waitpoint. You can use `.unwrap()` to get the result and an error will throw.
   */
  forToken: /* @__PURE__ */ __name((token) => {
    return new ManualWaitpointPromise(async (resolve, reject) => {
      try {
        const ctx = taskContext.ctx;
        if (!ctx) {
          throw new Error("wait.forToken can only be used from inside a task.run()");
        }
        const apiClient = apiClientManager.clientOrThrow();
        const tokenId = typeof token === "string" ? token : token.id;
        const result = await tracer.startActiveSpan(`wait.forToken()`, async (span) => {
          const response = await apiClient.waitForWaitpointToken({
            runFriendlyId: ctx.run.id,
            waitpointFriendlyId: tokenId
          });
          if (!response.success) {
            throw new Error(`Failed to wait for wait token ${tokenId}`);
          }
          const result2 = await runtime.waitUntil(tokenId);
          const data = result2.output ? await conditionallyImportAndParsePacket({ data: result2.output, dataType: result2.outputType ?? "application/json" }, apiClient) : void 0;
          if (result2.ok) {
            return {
              ok: result2.ok,
              output: data
            };
          } else {
            const error = new WaitpointTimeoutError(data.message);
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR
            });
            return {
              ok: result2.ok,
              error
            };
          }
        }, {
          attributes: {
            [SemanticInternalAttributes.STYLE_ICON]: "wait",
            [SemanticInternalAttributes.ENTITY_TYPE]: "waitpoint",
            [SemanticInternalAttributes.ENTITY_ID]: tokenId,
            id: tokenId,
            ...accessoryAttributes({
              items: [
                {
                  text: tokenId,
                  variant: "normal"
                }
              ],
              style: "codepath"
            })
          }
        });
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }, "forToken")
};
function nameForWaitOptions(options) {
  if ("seconds" in options) {
    return options.seconds === 1 ? `1 second` : `${options.seconds} seconds`;
  }
  if ("minutes" in options) {
    return options.minutes === 1 ? `1 minute` : `${options.minutes} minutes`;
  }
  if ("hours" in options) {
    return options.hours === 1 ? `1 hour` : `${options.hours} hours`;
  }
  if ("days" in options) {
    return options.days === 1 ? `1 day` : `${options.days} days`;
  }
  if ("weeks" in options) {
    return options.weeks === 1 ? `1 week` : `${options.weeks} weeks`;
  }
  if ("months" in options) {
    return options.months === 1 ? `1 month` : `${options.months} months`;
  }
  if ("years" in options) {
    return options.years === 1 ? `1 year` : `${options.years} years`;
  }
  return "NaN";
}
__name(nameForWaitOptions, "nameForWaitOptions");
function calculateDurationInMs(options) {
  if ("seconds" in options) {
    return options.seconds * 1e3;
  }
  if ("minutes" in options) {
    return options.minutes * 1e3 * 60;
  }
  if ("hours" in options) {
    return options.hours * 1e3 * 60 * 60;
  }
  if ("days" in options) {
    return options.days * 1e3 * 60 * 60 * 24;
  }
  if ("weeks" in options) {
    return options.weeks * 1e3 * 60 * 60 * 24 * 7;
  }
  if ("months" in options) {
    return options.months * 1e3 * 60 * 60 * 24 * 30;
  }
  if ("years" in options) {
    return options.years * 1e3 * 60 * 60 * 24 * 365;
  }
  throw new Error("Invalid options");
}
__name(calculateDurationInMs, "calculateDurationInMs");

// node_modules/@trigger.dev/sdk/dist/esm/v3/tasks.js
init_esm();
var task = createTask;

// node_modules/@trigger.dev/sdk/dist/esm/v3/index.js
init_esm();

export {
  defineConfig,
  wait,
  task
};
//# sourceMappingURL=chunk-NSHEPB4R.mjs.map
