module.exports = run;

function run(generator, callback) {
  var iterator;
  if (typeof generator === "function") {
    // Pass in resume for no-wrap function calls
    iterator = generator(resume);
  }
  else if (typeof generator === "object") {
    // Oterwise, assume they gave us the iterator directly.
    iterator = generator;
  }
  else {
    throw new TypeError("Expected generator or iterator and got " + typeof generator);
  }
  
  var data = null, yielded = false;

  var next = callback ? nextSafe : nextPlain;
  
  next();
  check();
  
  function nextSafe(err, item) {
    var n;
    try {
      n = (err ? iterator.throw(err) : iterator.next(item));
      if (!n.done) {
        if (typeof n.value === "function") n.value(resume());
        yielded = true;
        return;
      }
    }
    catch (err) {
      return callback(err);
    }
    return callback(null, n.value);
  }

  function nextPlain(err, item) {
    var cont = (err ? iterator.throw(err) : iterator.next(item)).value;
    // Pass in resume to continuables if one was yielded.
    if (typeof cont === "function") cont(resume());
    yielded = true;
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
