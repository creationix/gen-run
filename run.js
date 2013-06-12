module.exports = run;

function run(generator) {
  // Pass in resume for no-wrap function calls
  var iterator = generator(resume);
  var data = null, yielded = false;
  
  next();
  check();
  
  function next(item) {
    var cont = iterator.next(item).value;
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
      if (err) return iterator.throw(err);
      next(item);
      yielded = true;
    }
  }

}
