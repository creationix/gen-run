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
  console.log("End");

}

function* nowrap_sub(gen, n) {
  while (n) {
    console.log(n--);
    yield setTimeout(gen(), 10);
  }
  console.log("DONE!");
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
  }
}

function decrement(n) {
  return function (callback) {
    callback(null, n - 1);
  };
}

