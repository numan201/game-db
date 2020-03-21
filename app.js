const { googleOAuthKeys } = require('keys');

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const gamesRouter = require('./routes/games');
const developersRouter = require('./routes/developers');
const publishersRouter = require('./routes/publishers');
const gameRouter = require('./routes/game');
const developerRouter = require('./routes/developer');
const publisherRouter = require('./routes/publisher');
const aboutRouter = require('./routes/about');
const inRouter = require('./routes/in');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Google OAuth
const passport = require('passport');
const session = require("express-session");
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

app.use(session({ secret: "FXLGlQc0oDBaVDRf" }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new GoogleStrategy({
        clientID: googleOAuthKeys.clientId,
        clientSecret: googleOAuthKeys.clientSecret,
        callbackURL: 'http://gamedb.com:3000/auth/google/callback'
    },
    (accessToken, refreshToken, profile, done) => {
        app.locals.db.collection('users').findOne({ provider: "Google", accountId: profile.id}, (err, user) => {
            if (user) {
                return done(err, user);
            } else {

                let newUser = {
                    accountId: profile.id,
                    displayName: profile.displayName,
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,
                    provider: "Google",
                    picture: profile.photos[0].value,
                };

                app.locals.db.collection('users').insertOne(newUser, (err, user) => {
                    return done(err, newUser);
                });
            }
        });

    }
));

app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/failure' }),
    (req, res)  => {
        res.redirect('/');
    }
);

passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    let _id = require('mongodb').ObjectID(id);

    app.locals.db.collection('users').findOne({_id: _id}, (err, user) => {
        done(err, user);
    });
});

app.use('/', indexRouter);
app.use('/games', gamesRouter);
app.use('/developers', developersRouter);
app.use('/publishers', publishersRouter);
app.use('/game', gameRouter);
app.use('/about', aboutRouter);
app.use('/developer', developerRouter);
app.use('/publisher', publisherRouter);
app.use('/in', inRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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

module.exports = app;
