import { useState, useEffect } from "react";
import { Button, Row, Col, Spinner } from 'react-bootstrap/';
import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa";
import API from "../API";
import SubmissionForm from './Submission';


const SubmissionsList = (props) => {
    const { survey, loggedIn, setMessage, handleErrors } = props;
    const [currentSubmission, setCurrentSubmission] = useState(0); //used for sliding users submission
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
            API.getSubmissionsSurveyByID(survey.id)
                .then((result) => {
                    const tmp = [];
                    for (let submission of result) {
                        /* Since the elements arrives fromt the server in this way
                            [{questionID: 1, text: "Do you like it?", choiceID: 1, ​position: 0,  title: "yes", value: 0},
                            questionID: 1, text: "Do you like it?", choiceID: 2, ​position: 0,  title: "not", value: 1}]
                            we use the next function in order to store them in the state in a better way.
                        */
                        const submissionCloseAnswers = submission.closeAnswers.reduce((acc, q) => { 
                            const found = acc.find(a => a.questionID === q.questionID);
                            const value = { choiceID: q.choiceID, text: q.text, value: q.value };
                            if (!found) {
                                acc.push({ questionID: q.questionID, title: q.title, content: [value], position: q.position })
                            }
                            else {
                                found.content.push(value)
                            }
                            return acc.sort((a, b) => (a.choiceID > b.choiceID) ? 1 : -1);
                        }, []);

                        tmp.push({ name: submission.nameUser, questions: [...submissionCloseAnswers.concat(submission.openAnswers)] })
                    }
                    setSubmissions(tmp);
                    setLoading(false);
                })
                .catch((err) => {
                    handleErrors(err);
                });

    }, [])

    const previousSubmission = () => {
        setCurrentSubmission((currentSubmission) => currentSubmission - 1);
    }
    const nextSubmission = () => {
        setCurrentSubmission((currentSubmission) => currentSubmission + 1);
    }

    return (
        loading ?

            <Spinner animation='border' variant='primary' />
            :
            <Col sm="10" lg="8">
                <Row className="align-items-center">
                    <Col xs="1" >
                        <Button variant="link" className="shadow-none" disabled={currentSubmission === 0} onClick={previousSubmission}><FaArrowCircleLeft size={40} /></Button>
                    </Col>
                    <Col xs="10">
                        <SubmissionForm key={currentSubmission} loggedIn={loggedIn} survey={survey} submission={submissions[currentSubmission]} currentSubmission={currentSubmission} setMessage={setMessage} handleErrors={handleErrors}></SubmissionForm>

                    </Col>
                    <Col xs="1" >
                        <Button variant="link" className="shadow-none" disabled={currentSubmission === submissions.length - 1} onClick={nextSubmission} > <FaArrowCircleRight size={40} /></Button>
                    </Col>
                </Row>
            </Col>




    )
}

export default SubmissionsList;