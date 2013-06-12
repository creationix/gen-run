gen-run
=======

Generator Async Runner.  Makes it possible to yield and wait for callbacks and thunks.,

Supports both async functions that use node-style callbacks and thunk-returning async functions.

## What is a Thunk?

A "thunk" is also known as a "continuable" and is simply a function that accepts a node style callback as it's only argument.

A simple example is turning the `setTimeout` function to return a thunk instead of accepting a callback.

```js
function sleep(ms) {
  return function (callback) {
    setTimeout(callback, ms);
  };
}
```

## Using `run()`

Here is an example using ES6 generators with the `gen-run` library to implement sleep.

```js
var run = require('gen-run');

run(function* () {
  console.log("Hello");
  yield sleep(1000);
  console.log("World");
});
```

## Delegating Yield

Since this works by yielding thunks to the run function, delegating yield will also "just work".

```js
function* sub(n) {
  while (n) {
    console.log(n--);
    yield sleep(10);
  }
}

run(function* () {
  console.log("Start");
  yield* sub(10);
  console.log("End");
});
```

## Synchronous Callback Protection

The runner is aware that sometimes callbacks may be called before the thunk function returns and has safeguards internally to prevent stack overflows.

```js
function decrement(n) {
  return function (callback) {
    callback(null, n - 1);
  };
}

run(function* () {
  var i = 100000;
  while (i) {
    i = yield decrement(i);
  }
});
```

## Multi-Callback Protection

There is also protection from evil thunks that may call the callback multiple times when they should only ever call it once.  Run will simply ignore subsequent calls from the same thunk.

```js
function evil() {
  return function (callback) {
    callback(null, 1);
    setTimeout(function () {
      callback(null, 2);
    }, 100);
  }
}

run(function* () {
  console.log("Hello");
  yield evil();
  yield sleep(1000);
  console.log("World");
});
```

## Error Handling

I assume the callback in the thunk will be of the form `(err, item)` and will return the item as the result of yield or throw `err` into the generator.  This means that you can use async functions as if they were normal sync functions.

```js
// Wrap fs.readFile as a thunk style function.
// Also intercept ENOENT errors and instead return undefined for the result
function readFile(path, encoding) {
  return function (callback) {
    fs.readFile(path, encoding, function (err, data) {
      if (err) {
        if (err.code === "ENOENT") return callback();
        return callback(err);
      }
      return callback(null, data);
    });
  };
}

run(function* () {
  try {
    var contents = readFile("/myfile.txt", "utf8");
    if (contents) {
      // the file existed and was not empty
    }
  }
  catch (err) {
    // There was a problem reading the file, but it did exist.
  }
});
```

## What about Parallel Work?

Like the other libraries, I feel that doing parallel work it outside the scope of this tiny library.  It will work great with any control-flow library that supports thunks or callbacks.

## But ES6 isn't everywhere yet.

That's OK. In node.js land, you can require your users or your app's deployment to use a certain version of node.js that has generators.  But for browsers and older versions of node there are transpilers.  <https://github.com/google/traceur-compiler>, for example can convert ES6 generator code to vanilla ES5 code.

## Do I have to wrap everything I use then?

No, gen-run also works with any callback based API using a slightly more explicit syntax.

```js
run(function* (gen) {
  console.log("Hello");
  setTimeout(gen(), 1000);
  console.log("World");
});
```

This alternate API can be mixed and matched with thunk style APIs.  If you yield a function, it will assume it's a thunk and pass in a callback.  If you don't, it's your responsibility to pass in the generated callback manually in the right place.

If you want to use delegate yield with the explicit style it's up to you to pass the `gen` function to the child generator.

```js
function* sub(gen, n) {
  while (n) {
    console.log(n--);
    yield setTimeout(gen(), 10);
  }
}

run(function* (gen) {
  console.log("Start");
  yield* sub(gen, 10);
  console.log("End");
});
```

## Credits

This library is the result of my lua research and researching many other similair libraries and taking the parts I like from them.  Libraries I took inspiration from are:

 - <https://github.com/visionmedia/co>
 - <https://github.com/jmar777/suspend>
 - <https://gist.github.com/Benvie/5667557#file-usage-js>
 - <https://github.com/spion/genny>


