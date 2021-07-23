/**
 * All the API calls
 */

const BASEURL = '/api';

function getJson(httpResponsePromise) {
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {
          // always return {} from server, never null or non json, otherwise it will fail
          response.json()
            .then(json => resolve(json))
            .catch(err => reject({ error: "Cannot parse server response"  }))

        } else {
          // analyze the cause of error
          response.json()
            .then(obj => {
              reject(obj)}) // error msg in the response body
            .catch(err => reject({ error: `${response.status}: ${response.statusText}`})) // something else
        }
      })
      .catch(err => reject({ error: "Cannot communicate" })) // connection error
  });
}

/*** Surveys APIs ***/

async function getAllSurveys() {
  // call: GET /api/surveys
  return getJson(
    fetch(BASEURL + '/surveys')
  )
};

async function getAdminSurveys(userID) {
  // call: GET /api/admins/:id/:surveys
  return getJson(
    fetch(BASEURL + '/admins/' + userID + '/surveys')
  )
}


async function addSurvey(survey) {
  // call: POST /api/surveys
  return getJson(
    fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: survey.title, description: survey.description, questions: survey.questions }),
    })
  )
}

async function getQuestionBySurveyID(surveyID) {
  // call: GET /api/surveys/:id
  return getJson(
    fetch(BASEURL + '/surveys/' + surveyID)
  )
}



async function getSubmissionsSurveyByID(surveyID) {
  //call : GET /api/surveys/:id/submissions
  return getJson(
    fetch(BASEURL + '/surveys/' + surveyID + '/submissions')
  )
}


async function addSubmission(surveyID, name, answers, choices) {
  // call: POST /api/surveys/:id/submissions
  return getJson(
    fetch("/api/surveys/" + surveyID + "/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surveyID: surveyID, name: name, openAnswers: answers, closeAnswers: choices }),
    })
  )
}
 

/*** Users APIs ***/
async function login(credentials) {
  return getJson(
    fetch("/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })
  )
}

 
async function getUserInfo() {
  return getJson(
    fetch("api/sessions/current")
  )
}
 

async function logout() {
  await fetch("/api/sessions/current", { method: "DELETE" });
}

const API = {
  login,
  getUserInfo,
  logout,
  addSurvey,
  getAllSurveys,
  getAdminSurveys,
  addSubmission,
  getSubmissionsSurveyByID,
  getQuestionBySurveyID,
};
export default API;
