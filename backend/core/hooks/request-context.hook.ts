import { createHook, executionAsyncId } from 'async_hooks';
import { v4 } from 'uuid';

const store = new Map();

const asyncHook = createHook({
  init: (asyncId, _, triggerAsyncId) => {
    if (store.has(triggerAsyncId)) {
      store.set(asyncId, store.get(triggerAsyncId))
    }
  },
  destroy: (asyncId) => {
    if (store.has(asyncId)) {
      store.delete(asyncId);
    }
  }
});

asyncHook.enable();

const createRequestContext = (data, requestId = v4()) => {
  const requestInfo = { requestId, data };
  store.set(executionAsyncId(), requestInfo);
  return requestInfo;
};

const getRequestContext = () => {
  return store.get(executionAsyncId());
};

export { createRequestContext, getRequestContext };