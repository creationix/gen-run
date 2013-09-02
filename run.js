module.exports = run;

function run(generator, callback) {
  if (!callback) return bind(generator);
  // Pass in resume for no-wrap function calls
  var iterator = generator(resume);
  var data = null, yielded = false;

  next();
  check();

  function next(err, item) {
    var result;
    try {
      result = (err ? iterator.throw(err) : iterator.next(item));
      if (!result.done) {
        if (typeof result.value === "function") result.value(resume());
        yielded = true;
        return;
      }
    }
    catch (err) {
      return callback(err);
    }
    return callback(null, result.value);
  }

  function resume() {
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
      next(err, item);
      yielded = true;
    }
  }

}

function bind(generator) {
  return function (callback) {
    return run.call(this, generator, callback || throwit);
  };
}

function throwit(err) {
  if (err) throw err;
}
