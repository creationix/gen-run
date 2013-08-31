var run = require('./.');

function testRun(name, fn) {
  console.log("\nStarting", name);
  run(fn);
  console.log("Started", name);
}

testRun("basic", basic);

function* basic() {
  console.log("Hello");
  yield sleep(1000);
  console.log("World");
  testRun("delegating", delegating);
}

function* delegating() {
  console.log("Start");
  yield* sub(10);
  console.log("End");
  testRun("sync", sync);
}

function* sub(n) {
  while (n) {
    console.log(n--);
    yield sleep(10);
  }
}

function* sync() {
  var i = 100000;
  while (i) {
    i = yield decrement(i);
  }
  testRun("multi", multi);
}

function* multi() {
  console.log("Hello");
  yield evil();
  yield sleep(1000);
  console.log("World");
  testRun("nowrap", nowrap);
}

function* nowrap(gen) {
  console.log("Hello");
  yield setTimeout(gen(), 1000);
  console.log("World");
  testRun("nowrap_delegating", nowrap_delegating);
}

function* nowrap_delegating(gen) {
  console.log("Start");
  yield* nowrap_sub(gen, 10);
  testRun("run_with_callback", run_with_callback);
}

function* nowrap_sub(gen, n) {
  while (n) {
    console.log(n--);
    yield setTimeout(gen(), 10);
  }
  console.log("DONE!");
}

function *run_with_callback(gen) {
  console.log("Callback");
  var resume = gen();
  yield run(function* (gen) {
    yield sleep(1000);
    return "Hello";
  }, function (err, value) {
    console.log("Callback err: " + err);
    console.log("Callback value: " + value);
    resume(err, value);
  });
  testRun("run_with_callback_exception", run_with_callback_exception);
}

function *run_with_callback_exception(gen) {
  console.log("Callback err");
  var resume = gen();
  yield run(function *(gen) {
    yield sleep(1000);
    throw new Error("Some error");
  }, function (err, value) {
    console.log("Callback err: " + err);
    console.log("Callback value: " + value);
    resume(null, value); // Intentionally suppress the error
  });
  testRun("run_with_callback_early_exception", run_with_callback_early_exception);
}

function *run_with_callback_early_exception(gen) {
  console.log("Callback err");
  var resume = gen();
  yield run(function *(gen) {
    throw new Error("Some error");
    yield sleep(1000);
  }, function (err, value) {
    console.log("Callback err: " + err);
    console.log("Callback value: " + value);
    resume(null, value); // Intentionally suppress the error
  });
  testRun("run_with_thrown_error", run_with_thrown_error);
}

function *run_with_thrown_error(gen) {
  var inCatch = false;
  try {
    yield sleep(1);
    yield fail();
    console.error("this should not happen!");
  }
  catch (err) {
    console.log("in catch: " + err);
    console.assert(err);
    inCatch = true;
  }
  yield sleep(1);
  console.log("yielded after catch");
  console.assert(inCatch);
  console.log("\nEnd");
}

function sleep(ms) {
  return function (callback) {
    setTimeout(callback, ms);
  };
}

function evil() {
  return function (callback) {
    callback(null, 1);
    setTimeout(function () {
      callback(null, 2);
    }, 100);
  };
}

function fail() {
  return function (callback) {
    callback(Error("throwing error into generator"));
  };
}

function decrement(n) {
  return function (callback) {
    callback(null, n - 1);
  };
}
