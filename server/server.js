var express = require('express');
var bodyParser = require('body-parser');

var api = require('./api');

var app = express();

app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));

// Create link to Angular build directory
var distDir = __dirname + "/../dist/";
app.use(express.static(distDir));

app.use('/api', api);

app.get('*',function(req, res) {
  res.sendFile('index.html', {root: __dirname+'/../dist/'});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Initialize the app.
var server = app.listen(process.env.PORT || 4200, function () {
var port = server.address().port;
console.log("App now running on port", port);
});

module.exports = app;
