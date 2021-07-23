'use strict';

/* Data Access Object (DAO) module for accessing survey */

const db = require('./db');


// add a new survey
// the survey id, the questions id are added automatically by the DB, the survey id is returned as result
exports.createSurvey = (survey, userID) => {
  return new Promise((resolve, reject) => {
    const query =
      "INSERT INTO surveys( title,description, admin, nSubmissions) VALUES(?, ?, ?,?)";
    db.run(
      query,
      [survey.title, survey.description, userID, 0],
      function (err) {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }
        const surveyID = this.lastID;
        for (let i = 0; i < survey.questions.length; ++i) {
          const query2 = "INSERT INTO questions( title,min,max,survey, position) VALUES(?, ?, ?, ?,?)";
          db.run(
            query2,
            [survey.questions[i].titleQuestion, survey.questions[i].min, survey.questions[i].max, surveyID, survey.questions[i].position],
            function (err) {
              if (err) {
                console.log(err);
                reject(err);
                return;
              }
              const questionID = (this.lastID);
              if (survey.questions[i].max >= 1) {
                for (let j = 0; j < survey.questions[i].content.length; j++) {
                  const query3 = 'INSERT INTO CHOICES(question, text) VALUES (?, ?)';
                  db.run(query3, [questionID, survey.questions[i].content[j]], function (err) {
                    if (err) {
                      console.log(err);
                      reject(err);
                      return;
                    }
                    resolve(surveyID);
                  })
                }
              }
            });
        }
        resolve(surveyID);
      });
  });
};

// get all surveys
exports.listSurveys = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT surveys.id, surveys.title, surveys.description , surveys.admin FROM surveys  ';
    db.all(sql, [], (err, surveys) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(surveys);
    });
  });
};

// get all the surveys of the admin identified by {id}
exports.listAdminSurveys = (id) => {
  return new Promise((resolve, reject) => {
    const sql = ` SELECT  surveys.id , surveys.title , surveys.description, surveys.nSubmissions
    FROM  surveys 
    WHERE surveys.admin = ? `
    db.all(sql, [id], (err, surveys) => {
      if (err) {
        console.log(err)
        reject(err);
        return;
      }
      resolve(surveys);
    });
  });
};

// get the survey identified by {surveyID}
exports.getQuestionsBySurveyID = (surveyID) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id as questionID, title, min, max, position  FROM questions WHERE questions.survey=? ORDER BY questions.position';
    db.all(sql, [surveyID], (err, rows) => {
      if (err) {
        console.log(err)
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// get the options of a certain question identified by {row.id}
exports.getChoicesByQuestionID = (row) => {
  return new Promise((resolve, reject) => {
    const sql2 = 'SELECT id as choiceID, text, question  FROM  choices WHERE question= ?';
    db.all(sql2, [row.questionID], (err, options) => {
      if (err) {
        console.log(err)
        reject(err);
        return;
      }
      const result = row;
      result.content = options;
      resolve(result);
    });
  });
}

// get the max ID 
exports.getMaxUserID = () => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT MAX(userID) as userID FROM closeAnswers UNION SELECT MAX(userID) as userID FROM openAnswers ORDER BY userID DESC LIMIT 1`;
    db.get(sql, [], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      if (row.userID === null) {
        resolve(0);
      } else {
        resolve(row.userID);
      }
    });
  });
}

// insert a survey submission
exports.addSubmission = (lastUserID, submission) => {
  return new Promise((resolve, reject) => {
    const userID = lastUserID + 1;
    for (const choice of submission.closeAnswers) {
      const query = "INSERT INTO closeAnswers( userID,choice,value,nameUser) VALUES(?, ?, ?, ?)";
      db.run(
        query,
        [userID, choice.choiceID, choice.value, submission.name],
        function (err) {
          if (err) {
            console.log(err)
            reject(err);
            return;
          }
        }
      )
    };
    for (const answer of submission.openAnswers) {
      const query = "INSERT INTO openAnswers( userID,question,text,nameUser) VALUES(?, ?, ?, ?)";
      db.run(
        query,
        [userID, answer.questionID, answer.text, submission.name],
        function (err) {
          if (err) {
            console.log(err)
            reject(err);
            return;
          }
        })
    };

    const query = "UPDATE surveys SET nSubmissions=nSubmissions+1 WHERE id=?";
    db.run(
      query,
      [submission.surveyID],
      function (err) {
        if (err) {
          console.log(err)
          reject(err);
          return;
        }
        resolve(null);
      });
  });
}

/* Get all the users that have submitted a survey identified by {surveyID} */
exports.listUsersSubmissions = (surveyID) => {
  return new Promise((resolve, reject) => {
    const sql =
      `SELECT  userID, nameUser
      FROM openAnswers JOIN surveys JOIN questions
      WHERE surveys.id = ? AND questions.survey = surveys.id AND openAnswers.question = questions.id
      UNION
      SELECT userID, nameUser
      FROM  closeAnswers JOIN surveys JOIN questions JOIN choices
      WHERE surveys.id = ? AND questions.survey = surveys.id AND choices.question = questions.id AND choices.id = closeAnswers.choice`
    db.all(sql, [surveyID, surveyID], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}



// get all open answers given by the user {userID} to the survey identified by {surveyID} 
exports.getOpenAnswersBySurveyID = (userID, surveyID) => {
  return new Promise((resolve, reject) => {
    const sql =
      `SELECT questions.id as questionID, questions.title, openAnswers.text, questions.position
    FROM openAnswers JOIN questions
    WHERE questions.survey = ? AND questions.id = openAnswers.question AND openAnswers.userID = ?
    ORDER BY questions.position`
    db.all(sql, [surveyID, userID], (err, rows) => {
      if (err) {
        console.log(err)
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// get all close answers given by the user {userID} to the survey identified by {surveyID} 
exports.getCloseAnswersBySurveyID = (userID, surveyID) => {
  return new Promise((resolve, reject) => {
    const sql =
      `SELECT questions.id as questionID, questions.title, questions.position, choices.id as choiceID, closeAnswers.value,choices.text
      FROM closeAnswers JOIN questions JOIN choices
      WHERE questions.survey = ? AND choices.question = questions.id AND closeAnswers.userID = ? AND closeAnswers.choice = choices.id
      ORDER BY questions.position`
    db.all(sql, [surveyID,userID], (err, rows) => {
      if (err) {
        console.log(err)
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

