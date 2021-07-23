import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Spinner, Row } from 'react-bootstrap/';
import { BrowserRouter as Router, Route, Redirect, Switch } from 'react-router-dom';
import { useState, useEffect } from 'react';

import './App.css';

import Navigation from './components/Navigation';
import CreationSurveyForm from './components/CreationSurvey';
import LoginForm from './components/Login.js';
import SubmissionForm from './components/Submission';
import SurveysList from './components/SurveysList';
import PageNotFound from './components/PageNotFound';
import SubmissionsList from './components/SubmissionsList';
import AlertBox from './components/Message';

import API from './API';



function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState([]); // if the user is logged in, the state contains her/his surveys otherwise it contains all surveys
  const [dirty, setDirty] = useState(true);   // at the beginning, no user is logged in
  const [message, setMessage] = useState("");
  const [admin, setAdmin] = useState('');
  const [alert, setAlert] = useState(false);



  useEffect(() => {
    const checkAuth = async () => {
      // check if user is authenticated
      try {
        const adminInfo = await API.getUserInfo();
        setAdmin(adminInfo);
        setDirty(false);
        setLoggedIn(true);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        console.error(err.error);
      }
    };
    checkAuth();

  }, []);

  useEffect(() => {
    if (!loggedIn) {
      API.getAllSurveys()
        .then((surveys) => {
          setLoading(false);
          setDirty(false);
          setSurveys(surveys);
        })
        .catch(e => handleErrors(e))
    }
    else {
      API.getAdminSurveys(admin.id)
        .then((surveys) => {
          setLoading(false);
          setDirty(false);
          setSurveys(surveys);
       
        })
        .catch(e => handleErrors(e))
    }

  }, [loggedIn, dirty, admin.id]);

  useEffect(() => {
    if (message !== "") {
      setAlert(true);
    }
  }, [message]);

  // show error message in alert
  const handleErrors = (err) => {
    setMessage({ msg: err.error, type: 'danger' });
  }

  const doLogin = async (credentials) => {
    try {
      const admin = await API.login(credentials);
      setSurveys([]);
      setLoggedIn(true);
      setAdmin(admin);
      setDirty(true);
      setLoading(true);
      setMessage({ msg: `Welcome, ${admin.name}!`, type: "success" });
    }
    catch (err) {
      // error is handled and visualized in the login form, do not manage error, throw it
      // handleErrors(err)
      throw err;
    }
  }

  const doLogout = async () => {
    try {
      await API.logout()
      setLoggedIn(false);
      setAlert(false);
      setAdmin('');
      setSurveys([]);
    }
    catch (err) {
      handleErrors(err);
    }
  };



  return (
    <Router>
      <Navigation loggedIn={loggedIn} setLoggedIn={setLoggedIn} doLogout={doLogout} />
      <Container id='main-container' fluid>
        <AlertBox alert={alert} setAlert={setAlert} message={message} />
        <Row className="justify-content-center">
          <Switch>
            <Route exact path="/surveys" render={() => //if the user is logged it shows all surveys otherwise it shows the user's surveys.
              <>
                {
                  !loading ?
                    <SurveysList loggedIn={loggedIn} surveys={surveys} setMessage={setMessage}></SurveysList> :
                    <div className="mx-auto">
                      <Spinner animation='border' variant='primary' />
                    </div>
                }
              </>
            }
            />

            <Route exact path='/login'
              render={() => (
                <>
                  {loggedIn ? (
                    <Redirect to='/surveys' />
                  ) : (
                    <LoginForm login={doLogin} setMessage={setMessage} handleErrors={handleErrors} />
                  )}
                </>
              )}
            />

            <Route exact path="/" render={() =>
              <Redirect to='/surveys' />
            }
            />

            <Route exact path='/createSurvey'
              render={() => (

                <>
                  {loggedIn ? <CreationSurveyForm loggedIn={loggedIn} setMessage={setMessage} setDirty={setDirty} handleErrors={handleErrors} /> : <Redirect to='/surveys' />}</>
              )}
            />

            <Route exact path="/surveys/:id/submissions" render={({ location }) =>
              <>{loggedIn ?
                <SubmissionsList survey={location.state ? location.state.survey : ''} setMessage={setMessage} loggedIn={loggedIn} handleErrors={handleErrors} /> :
                <Redirect to="/surveys" />}
              </>
            }
            />

            <Route
              exact path='/surveys/:id'
              render={({ location }) => (
                <>
                  {loggedIn ? (
                    <Redirect to='/surveys' />
                  ) : (
                    <SubmissionForm loggedIn={loggedIn} survey={location.state ? location.state.survey : ''} setMessage={setMessage} handleErrors={handleErrors} />
                  )}
                </>
              )}
            />

            <Route path="/" render={() =>
              <PageNotFound></PageNotFound>}
            />

          </Switch>
        </Row>
      </Container>
    </Router>

  );
}

export default App;
