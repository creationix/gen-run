module.exports = run;

function run(generator, callback) {
  // Pass in gen for no-wrap function calls
  var iterator = generator(gen);
  var data = null, yielded = false, calledGen = false;

  if (!callback) callback = function (err) {
    // If the generator ended with an error, throw it globally with setTimeout.
    // Throwing locally from a callback is not allowed, and swallowing the
    // error is a bad idea, so there's no better option.
    if (err) setTimeout(function () { throw err; }, 0);
  };

  next();
  check();
  
  function next(err, item) {
    var n;
    try {
      n = (err ? iterator.throw(err) : iterator.next(item));
      if (!n.done) {
        if (!calledGen && typeof n.value === "function") n.value(gen());
        if (!calledGen) {
          throw Error("generator didn't yield a continuable or call gen()");
        }
        yielded = true;
        return;
      }
    }
    catch (err) {
      return callback(err);
    }
    return callback(null, n.value);
  }
  
  function gen() {
    if (yielded) throw Error("gen() can only be called from the generator");
    if (calledGen) throw Error("gen() already called");
    calledGen = true;
    var done = false;
    return function () {
      if (done) return;
      done = true;
      data = arguments;
      check();
    };
  }
  
  function check() {
    while (data && yielded) {
      var err = data[0];
      var item = data[1];
      data = null;
      yielded = false;
      calledGen = false;
      next(err, item);
    }
  }

}
