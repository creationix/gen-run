gen-run
=======

Generator Async Runner.  Makes it possible to yield and wait for callbacks and [continuables](https://github.com/creationix/js-git#continuables).

Supports both async functions that use node-style callbacks and continuable-returning async functions.

## What is a Continuable?

A "continuable" is simply a function that accepts a node style callback as it's only argument.

A simple example is turning the `setTimeout` function to return a continuable instead of accepting a callback.

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

If you pass a second parameter to `run()` it will call the function back with the return result of the function. For example,

```js
run(function *() {
  console.log("Hello");
  yield sleep(1000);
  console.log("World");
  return "Hello World";
}, function (err, value) {
  if (err) console.log("Error encountered: " + err);
  else console.log(value);
});
```

## Delegating Yield

Since this works by yielding continuables to the run function, delegating yield will also just work.

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

The runner is aware that sometimes callbacks may be called before the continuable function returns and has safeguards internally to prevent stack overflows.

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

There is also protection from evil functions that may call the callback multiple times when they should only ever call it once.  Run will simply ignore subsequent calls from the same continuable.

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

I assume the callback in the continuable will be of the form `(err, item)` and will return the item as the result of yield or throw `err` into the generator.  This means that you can use async functions as if they were normal sync functions.

```js
// Wrap fs.readFile as a continuable style function.
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
    var contents = yield readFile("/myfile.txt", "utf8");
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

Gen-Run has basic built-in support for parallel work via yielding arrays or maps of continuables.

If you yield an array of continuable functions, it will run them all in parallel and return the results.  If there is an error in any of them, the expression will throw.

The same works for objects except the result is an object.  This allows for named data.

## But ES6 isn't everywhere yet.

That's OK. In node.js land, you can require your users or your app's deployment to use a certain version of node.js that has generators.  But for browsers and older versions of node there are transpilers.  <https://github.com/google/traceur-compiler>, for example can convert ES6 generator code to vanilla ES5 code.

## Do I have to wrap everything I use then?

No, gen-run also works with any callback based API using a slightly more explicit syntax.

```js
run(function* (gen) {
  console.log("Hello");
  yield setTimeout(gen(), 1000);
  console.log("World");
});
```

This alternate API can be mixed and matched with continuable style APIs.  If you yield a function, it will assume it's a continuable and pass in a callback.  If you don't, it's your responsibility to pass in the generated callback manually in the right place.

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

## License

The MIT License (MIT)

Copyright (c) 2013 Tim Caswell

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
