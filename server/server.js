'use strict';

const express = require('express');
const morgan = require('morgan');
const { check, validationResult } = require('express-validator');
const userDao = require('./user-dao'); // module for accessing the users in the DB
const surveyDao = require('./survey-dao'); // module for accessing the users in the DB
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

const app = new express();
const port = 3001;

// set-up the middlewares
app.use(morgan('dev'));
app.use(express.json());

/*** Set up Passport ***/
// set up the "username and password" login strategy
// by setting a function to verify username and password
passport.use(new LocalStrategy(
  function (username, password, done) {
    userDao.getUser(username, password).then((user) => {
      if (!user)
        return done(null, false, { error: 'Incorrect email and/or password.' });

      return done(null, user);
    })
  }
));

// serialize and de-serialize the user (user object <-> session)
// we serialize the user id and we store it in the session: the session is very small in this way
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// starting from the data in the session, we extract the current (logged-in) user
passport.deserializeUser((id, done) => {
  userDao.getUserById(id)
    .then(user => {
      done(null, user); // this will be available in req.user
    }).catch(err => {
      done(err, null);
    });
});



// custom middleware: check if a given request is coming from an authenticated user
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated())
    return next();
  return res.status(401).json('Not authenticated');
}

// set up the session
app.use(session({
  secret: 'a secret sentence',
  resave: false,
  saveUninitialized: false
}));

// init passport
app.use(passport.initialize());
app.use(passport.session());

const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  // Format express-validate errors as strings
  return `${location}[${param}]: ${msg}`;
};

/*** Users APIs ***/

/**
 * POST /sessions
 * login
 */

app.post("/api/sessions", [check("username").isEmail()], function (req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({error:"Invalid email and/or password"});
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json(info);
    }
    // success, perform the login
    req.login(user, (err) => {
      if (err) return next(err);
      // req.user contains the authenticated user, we send all the user info back
      // this is coming from userDao.getUser()
      return res.json(req.user);
    });
  })(req, res, next);
});

/**
 * DELETE /sessions/current 
 * logout
 */

app.delete('/api/sessions/current', (req, res) => {
  req.logout();
  res.end();
});

/**
 * GET /sessions/current 
 * check whether the user is logged in or not
 */
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  }
  else
    res.status(401).json({ error: 'Unauthenticated user!' });;
});




/*** Surveys APIs ***/

/**
 *  GET /api/surveys/:id/submissions
 *  get all the submission related to a survey identified by req.params.id
 */
app.get('/api/surveys/:id/submissions', check('id').isInt(), isLoggedIn,  (req, res) => {
  const errors = validationResult(req).formatWith(errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: errors.array().join(", ")  });
  }
  surveyDao.listUsersSubmissions(req.params.id) //get all the users that have submitted the form
    .then((rows) => {
      let result = [];
      let promise1 = [];
      let promise2 = [];
      for (let i = 0; i < rows.length; ++i) {  //get for each user all his/her ansewers
        result.push(rows[i]);
        promise1[i] = surveyDao.getCloseAnswersBySurveyID(rows[i].userID, req.params.id)
          .then((closeAnswers) => {
            result[i].closeAnswers = [...closeAnswers];
          });
        promise2[i] = surveyDao.getOpenAnswersBySurveyID(rows[i].userID, req.params.id)
          .then((openAnswers) => {
            result[i].openAnswers = [...openAnswers];
          });
      }
      let promises = promise1.concat(promise2);
      Promise.all(promises).then(() => {
        res.status(200).json(result);
      }) 
    }).catch((error) => {
      res.status(503).json({ error: `Database error during the loading of the submissions of the survey ${req.params.id}` })
    })
}
);

/**
 *  POST /api/surveys/:id/submissions
 *  add a submission to the survey identified by {id}
 */
app.post('/api/surveys/:id/submissions',
  check('surveyID').isInt(),
  check('name').isLength({ min: 1, max: 100}),
  check('closeAnswers').custom((value, { req }) => {
    for (const question of value) {
      if (!Number.isInteger(question.questionID) || !Number.isInteger(question.choiceID) || !Number.isInteger(question.value) || question.value < 0 || question.value > 1)
        return false;
    }
    return true;
  }),
  check('openAnswers').custom((value, { req }) => {
    for (const question of value) {
      if (question.text.length > 200)
        return false;
    }
    return true;
  }),  (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ")});
    }

    surveyDao.getMaxUserID(req.params.id).then(lastUserID => surveyDao.addSubmission(lastUserID, req.body))
      .then(() => res.status(201).json({}))
      .catch(() => res.status(503).json({ error: `Database error during the submission of the survey.` }));
  });



/**
 * GET /api/surveys/:id
 * get the list of questions of the survey identified by id
 */

app.get('/api/surveys/:id', [check('id').isInt()], (req, res) => {
  const errors = validationResult(req).formatWith(errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: errors.array().join(", ")  });
  }
  surveyDao.getQuestionsBySurveyID(req.params.id)
    .then(questions => {
      let result = [];
      let promises = [];
      for (let i = 0; i < questions.length; ++i) {
        if (questions[i].max >= 1) {
          promises.push(surveyDao.getChoicesByQuestionID(questions[i]).then(question => result.push(question)))
        }
        else {
          result.push(questions[i]);
        }
      }
      Promise.all(promises).then(() => {
        res.status(200).json(result);
      }) 
    })
    .catch(() => res.status(500).json({ error: `Database error during the loadig of the survey ${req.params.id}` }).end());
}
);


/**
 * POST /api/surveys 
 * create a new survey
 */

app.post('/api/surveys', isLoggedIn,
  check('title').isLength({ min: 1 }),
  check('questions').custom((value, { req }) => {
    for (const question of value) {
      if (question.max > 10 || question.min < 0  || question.max < 0 || !Number.isInteger(question.id) || question.titleQuestion.length === 0)
        return false;
    }
    return true;
  }),
   (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter)
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") });
    }
    surveyDao.createSurvey(req.body, req.user.id)
      .then((id) => {
        res.status(201).json(id);
      })
      .catch(() => res.status(503).json({ error: `Database error during the creation of the survey.` }));
  });



/**
 * GET /api/surveys 
 * get all surveys 
 */
app.get('/api/surveys',  (req, res) => {
  surveyDao.listSurveys()
    .then(surveys => res.status(200).json(surveys))
    .catch(() => res.status(500).json({ error: `Database error during the loading of the surveys` }).end());
});

/**
 * GET /api/admins/:id/:surveys
 * get all surveys of the user identified by {req.params.id}
 */
app.get('/api/admins/:id/surveys', isLoggedIn,  (req, res) => {
  surveyDao.listAdminSurveys(req.params.id)
    .then(surveys => res.status(200).json(surveys))
    .catch(() => {
      res.status(500).json({ error: `Database error during the loading of the user's surveys identified by ${req.params.id}` }).end();
    });
});





/*** Other express-related instructions ***/

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});