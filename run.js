module.exports = run;

function run(generator, callback) {
  // Pass in resume for no-wrap function calls
  var iterator = generator(resume);
  var data = null, yielded = false;
  var next;

  if (callback)
    next = function next(item) {
      try {
        var cont = iterator.next(item);
        if (cont.done) 
          callback(null, cont.value);
        else {
          if (typeof cont.value === "function") cont.value(resume());
          yielded = true;
        }
      }
      catch (e) {
        callback(e, null);
      }
    }
  else
    next = function next(item) {
      var cont = iterator.next(item).value;
      // Pass in resume to continuables if one was yielded.
      if (typeof cont === "function") cont(resume());
      yielded = true;
    }

  next();
  check();

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
      if (err) return iterator.throw(err);
      next(item);
      yielded = true;
    }
  }
}
