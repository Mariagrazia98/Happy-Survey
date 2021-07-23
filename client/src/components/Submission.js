import { useState, useEffect } from "react";
import { Form, Col, Row, InputGroup, Button } from "react-bootstrap";
import { Redirect } from 'react-router-dom';
import API from "../API";
import "../css/Submission.css";


const SubmissionForm = (props) => {
    const { survey, setMessage, loggedIn, submission, handleErrors } = props;
    const [questions, setQuestions] = useState([]);
    const [closeAnswers, setCloseAnswers] = useState([]); //stores the close answers 
    const [openAnswers, setOpenAnswers] = useState([]) //in the DB there is a table (openAnswer) that stores if the an option is selected by a certain user.
    const [validated, setValidated] = useState(false);
    const [name, setName] = useState(""); //it stores the name of the user.
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (loggedIn) {
            setName(submission.name)
            setQuestions([...submission.questions.sort((a, b) => (a.position > b.position) ? 1 : -1)]);
        }
        else {
            API.getQuestionBySurveyID(survey.id)
                .then((result) => {
                    setQuestions([...result.sort((a, b) => (a.position > b.position) ? 1 : -1)]);
                    const temporaryOpenAnswers = [];
                    const temporaryCloseAnswers = []
                    for (const question of result) {
                        if (question.max === 0) { //open question
                            temporaryOpenAnswers.push({ questionID: question.questionID, text: "" })
                        }
                        else {
                            for (const choice of question.content) {
                                temporaryCloseAnswers.push({ questionID: question.questionID, choiceID: choice.choiceID, value: 0 })
                            }
                        }
                    }
                    setOpenAnswers(temporaryOpenAnswers);
                    setCloseAnswers(temporaryCloseAnswers);
                })
                .catch((err) => {
                    handleErrors(err);
                });
        }
    }, [loggedIn])


    const handleSubmit = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const form = event.currentTarget;
        //verify if there is a answer that doesn't respect the min and the max number of selectable choices
        for (const question of questions) {
            if (question.max >= 1) { //multiple question
                const tmp = closeAnswers.filter(o => o.questionID === question.questionID && o.value === 1).length //number of options selected for a certain answer
                if (tmp < question.min || tmp > question.max) {
                    setValidated(true);
                    return;
                }
            }
        }
        if (!form.checkValidity()) {
            setValidated(true);
        }
        else {
            API.addSubmission(survey.id, name, openAnswers, closeAnswers)
                .then(() => {
                    setMessage({ msg: "Form submitted with success", type: "success" })
                    setSubmitted(true);
                })
                .catch((err) => {
                    handleErrors(err);
                })

        }
    }

    const updateOpenAnswer = (event) => {
        const index = openAnswers.findIndex(a => a.questionID.toString() === event.target.id);
        if (index !== -1) {
            const tmp = [...openAnswers];
            tmp[index].text = event.target.value;
            setOpenAnswers(tmp);
        }
    }
    const updateCloseAnswer = (event) => {
        const index = closeAnswers.findIndex(o => o.choiceID.toString() === event.target.id);
        if (index !== -1) {
            const tmp = [...closeAnswers];
            tmp[index].value = tmp[index].value ? 0 : 1;
            setCloseAnswers(tmp);
        }
    }


    return (
        <>{submitted ? <Redirect to="/" /> :

            <Col sm={!loggedIn ? "8" : "12"} lg={!loggedIn ? "6" : "12"} className="mb-3">

                <h1 className="font-italic text-center">{survey.title}</h1>
                <p className="font-italic text-center">{survey.description ? survey.description : ""}</p>
                {loggedIn ? <h3 className="mt-3 mb-3"> Submission n°:{props.currentSubmission + 1}</h3> : <></>}
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Form.Group as={Row} controlId="nameUser">
                        <Form.Label column sm="5" md="3">
                            {loggedIn ? "User's" : "Your"} name
                        </Form.Label>
                        <Col sm="7" md="5">
                            <Form.Control required type="text" placeholder="Name" onChange={(event) => setName(event.target.value)} readOnly={loggedIn} value={name} />
                        </Col>
                    </Form.Group>


                    {questions ? questions.map((question) => {
                        return (
                            <Answer key={question.questionID} question={question} updateCloseAnswer={updateCloseAnswer} updateOpenAnswer={updateOpenAnswer} validated={validated} loggedIn={loggedIn}></Answer>
                        );
                    }) : <></>}

                    {!loggedIn ? <Row className="justify-content-end">
                        <Button variant="primary" type="submit" size="lg" className="mt-2 mb-3">
                            Fill survey
                        </Button>
                    </Row> : <></>}
                </Form>

            </Col>


        }
        </>
    )
}
const Answer = (props) => {
    const { question, updateCloseAnswer, updateOpenAnswer, loggedIn, validated } = props;
    const [numberOptionsSelected, setNumberOptionsSelected] = useState(0);

    const updateOption = (event) => {
        let tmp = numberOptionsSelected;
        if (event.target.checked) {
            setNumberOptionsSelected(tmp + 1);
        }
        else {
            setNumberOptionsSelected(tmp - 1);
        }
        updateCloseAnswer(event);
    }


    return (
        <>
            <h4 className="mt-3 font-italic text-center">{question.title}</h4>
            {question.max === 0 || question.text || question.text === "" ? //open question (the first condition is valid for the utilization of the form, the second and the third are used for visualization of the form by admin)
                <>
                    <Form.Control as="textarea" id={question.questionID} className="mt-3" required={!loggedIn ? question.min === 1 : ""} maxLength={200} placeholder={!loggedIn ? "Write something..:" : question.text} readOnly={loggedIn} onChange={(event) => updateOpenAnswer(event)} />
                    {!loggedIn && question.min >= 1 ? <div className="small">*required</div> : <></>}</>

                : //close question

                <>
                    {!loggedIn ? <p>  Min number of choices: {question.min} , max number of choices: {question.max}</p> : <></>}


                    {question.content.map((option, index) => (

                        <InputGroup key={option.choiceID}  >
                            <Form.Check
                                type="checkbox"
                                id={option.choiceID}
                                label={option.text}
                                className="text-reset"
                                disabled={loggedIn}
                                checked={option.value}
                                onClick={(event) => loggedIn ? "" : updateOption(event)}
                            />
                        </InputGroup>
                       
                    ))
                    }

                    {!loggedIn && validated && (numberOptionsSelected < question.min || numberOptionsSelected > question.max) ?
                        <div className="text-danger small">Please select the correct number of options..</div>
                        : <></>}

                </>
            }

        </>
    );
}



export default SubmissionForm;