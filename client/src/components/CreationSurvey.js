import { useState, useEffect } from "react";
import { Form, Col, Row, InputGroup, FormControl, Button } from "react-bootstrap";
import { BsTrash } from "react-icons/bs";
import { FaArrowCircleUp, FaArrowCircleDown } from "react-icons/fa";
import { Redirect } from 'react-router-dom';
import API from "../API";

const CreationSurveyForm = (props) => {
    const { setMessage, setDirty, handleErrors } = props;
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [questions, setQuestions] = useState([]);   //used to store the questions
    const [lastQuestionID, setLastQuestionID] = useState(0); //used for giving a temporary ID to questions
    const [insertQuestion, setInsertQuestion] = useState(true); //is true when the admin is adding a new question
    const [validated, setValidated] = useState(false); //used for the validation of the entire form 
    const [submitted, setSubmitted] = useState(false);


    const publishSurvey =  (event) => {
        event.preventDefault();
        event.stopPropagation();

        const form = event.currentTarget;

        if (!form.checkValidity() || insertQuestion) {
            setValidated(true);
            if (insertQuestion) {
                setMessage({ msg: "Complete the creation of the last question before the publication of the form", type: "danger" });
            }
        }
        else {
            const survey = { title: title, description: description, questions: questions };
            survey.questions.forEach(function (row, index) {
                row.position = index;
            });
            API.addSurvey(survey)
                .then(() => {
                    setSubmitted(true);
                    setDirty(true);
                    setMessage({ msg: "Form created with success", type: "success" })
                })
                .catch((err) => {
                    handleErrors(err);
                });
        }
    }

    const addQuestion = (titleQuestion, content, min, max) => {
        const newQuestion = { id: lastQuestionID, titleQuestion: titleQuestion, content: content, min: min, max: max }
        setQuestions((questions) => [...questions, newQuestion]);
        setInsertQuestion(false);
        setLastQuestionID((lastQuestionID ) => lastQuestionID + 1);

    }
    const removeQuestion = (id) => {        
        const index = questions.findIndex(q => q.id === id);
        const tmp = [...questions]
        tmp.splice(index, 1);
        setQuestions(tmp);
    }
    const moveUp = (id) => {
        const index = questions.findIndex(q => q.id === id);
        if (index >= 1) { //is not the first element of array
            let data = questions.map((x) => x);
            let tmp = data[index];
            data[index] = data[index - 1];
            data[index - 1] = tmp;
            setQuestions(data);
        }
    }
    const moveDown = (id) => {
        const index = questions.findIndex(q => q.id === id);
        if (index !== questions.length - 1) { //is not the last element of array
            let data = questions.map((x) => x);
            let tmp = data[index];
            data[index] = data[index + 1];
            data[index + 1] = tmp;
            setQuestions(data);
        }
    }

    return (
        <>{submitted ? <Redirect to="/" /> :
            <Col sm="8" lg="6">
                <Form noValidate validated={validated} onSubmit={publishSurvey} className="mt-2">
                    <Row className="justify-content-end"> <Button variant="primary" type="submit" size="lg" className="mt-2" disabled={questions.length < 1}>
                        PUBLISH SURVEY
                    </Button></Row>

                    <Form.Row>
                        <Form.Group as={Col} controlId="surveyTitle">
                            <Form.Label> <h3 className="font-italic">Title</h3></Form.Label>
                            <Form.Control
                                required
                                type="text"
                                placeholder="Choose a title for your survey.."
                                onChange={(event) => setTitle(event.target.value)}
                            />
                            <Form.Control.Feedback type="valid">Looks good!</Form.Control.Feedback>
                            <Form.Control.Feedback type="invalid">Please..choose a title</Form.Control.Feedback>
                        </Form.Group>
                    </Form.Row>



                    <Form.Row>
                        <Form.Group as={Col} controlId="surveyDresciption" className="mt-3">
                            <Form.Label><h5 className="font-italic"> Drescription </h5></Form.Label>
                            <Form.Control as="textarea" className="mb-4" placeholder={"Write something.."} onChange={(event) => setDescription(event.target.value)} />
                        </Form.Group>
                    </Form.Row>

                </Form>

                {questions ? questions.map((question, index) => (
                    <><h3 className="font-italic text-center"> Question num° {index + 1}</h3>
                    
                        <Question key={question.id} moveUp={moveUp} moveDown={moveDown} removeQuestion={removeQuestion} question={question} ></Question> </>
                )) : ""
                }


                {insertQuestion === true ?
                    <>
                        <h4 className="mt-2 mb-2 font-italic text-center"> Adding a new question...</h4>
                        <Question addQuestion={addQuestion} ></Question> </> :
                        <Button variant="primary" onClick={() => setInsertQuestion(true)} className="mt-3 mb-3">Add a new question</Button>

                }
            </Col>


        }</>

    )
}

const Question = (props) => {
    const {addQuestion, question, moveUp, moveDown, removeQuestion } = props;
    const [titleQuestion, setTitleQuestion] = useState(question ? question.titleQuestion : "");
    const [content, setContent] = useState(question ? question.content : []);
    const [min, setMin] = useState(question ? question.min : 0); //0 not required, > 0 required
    const [max, setMax] = useState(question ? question.max : 1); //0 for open question, 1 for a sigle choice, >1 for a multiple question

    const [validated, setValidated] = useState(false);


    const handleSubmit = (event) => {

        event.preventDefault();
        event.stopPropagation();

        const form = event.currentTarget;
        if (!form.checkValidity()) {
            setValidated(true); // enables bootstrap validation error report
        }
        else {
            addQuestion(titleQuestion, content, min, max);
            setTitleQuestion("");
            setContent([]);
            setMin(0);
            setMax(1);
        }
    };

    const changeTypeQuestion = (event) => {
        if (max === 0 && event.target.id === "close") {
            setMax(1);
            setContent([]);
        }
        else if (max >= 1 && event.target.id === "open") {
            setMax(0);
            setContent([]);
        }
    }


    return (
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Row className="align-items-center">

                <Form.Group as={Col} controlId="questionTitle" className=" mr-3">
                    <Form.Label className="font-italic"  >Question title</Form.Label>

                    <Form.Control
                        required
                        type="text"
                        placeholder="Write something here.."
                        value={titleQuestion || ""}
                        onChange={(event) => (setTitleQuestion(event.target.value))}
                        readOnly={question}
                    />

                    <Form.Control.Feedback type="valid">Looks good!</Form.Control.Feedback>
                    <Form.Control.Feedback type="invalid">Please..choose a title question</Form.Control.Feedback>
                </Form.Group>


                {question ? 
                <>
                    <Button variant="danger" className="mt-4" onClick={() => removeQuestion(question.id)}>Remove question</Button>
                    <Button variant="link" className="shadow-none mt-4" size="lg" onClick={() => moveDown(question.id)}><FaArrowCircleDown size={30} /></Button>
                    <Button variant="link" className="shadow-none mt-4" size="lg" onClick={() => moveUp(question.id)}> <FaArrowCircleUp size={30} /></Button>
                </>
                    : <></>
                }
            </Form.Row>

            {!question ? <Form.Row className="mb-3">
                <Form.Check
                    inline
                    label="Open question"
                    name="typeQuestion"
                    type="radio"
                    id="open"
                    required
                    defaultChecked={max === 0}
                    onClick={changeTypeQuestion}
                    disabled={question}
                />
                <Form.Check
                    inline
                    label="Close question"
                    name="typeQuestion"
                    type="radio"
                    id="close"
                    required
                    defaultChecked={max >= 1}
                    onClick={changeTypeQuestion}
                    disabled={question}
                >

                </Form.Check>
            </Form.Row>
            :<></>}

            {
                max >= 1 ? ( //close question
                    <MultipleQuestion options={content} setOptions={setContent} min={min} setMin={setMin} max={max} setMax={setMax} question={question} validated={validated}></MultipleQuestion>

                ) : max === 0 ? <OpenQuestion min={min} setMin={setMin} question={question}></OpenQuestion>
                    : <></>
            }


            {!question ? <Button type="submit" variant="primary" className="mt-3 mb-3" > Add question</Button> : <></>}

        </Form >

    );
}

const MultipleQuestion = (props) => {
    const { options, setOptions, min, setMin, max, setMax, question, validated } = props;
    const addNewOption = () => {
        setOptions((oldOptions) => [...oldOptions, ""]);
    }
    const updateOption = (event, index) => {
        const tmp = [...options]
        tmp[index] = event.target.value;
        setOptions(tmp);
    }
    useEffect(() => {
        if (max >= 1 && options.length === 0) { //close question
            setOptions([""]) //in this way, when the component is mounted a default option is showed
        }
    }, []);

    return (
        <>
            {options.map((option, index) => (
                <Form.Row key={index}>
                    <Col xs={6}>
                        <InputGroup key={index}>
                            <InputGroup.Checkbox aria-label={options[index]} />
                            <Form.Control required type="text" placeholder={`Option ${index + 1}`} value={option} onChange={(event) => updateOption(event, index)} readOnly={question}>
                            </Form.Control>
                            {!question ? <Button variant="light" onClick={() => setOptions(options.filter((data, idx) => idx !== index))} disabled={options.length === 1 || question} >
                                <BsTrash />
                            </Button> : <></>}
                        </InputGroup>
                    </Col>
                </Form.Row>

            ))
            }
            {options.length < 10 && !question ?
                <Form.Row> 
                    <Col xs={6}>
                        <InputGroup>
                            <InputGroup.Checkbox />
                            <FormControl onClick={addNewOption} placeholder="Click here for adding an option" readOnly />
                        </InputGroup>
                    </Col>

                </Form.Row>
                : <></>}
            {validated && options.length === 1 && options[0] === "" ?
                <div className="text-danger small">Please insert at least an option.</div>
                : <></>}


            <Form.Row className="mt-1" >

                <Form.Group as={Col} sm={6} md={4} lg={3} controlId="formMinNumberOptions">

                    <Form.Label>Minimum number of selectable options</Form.Label>
                    <Form.Control type='number'
                        min={0}
                        max={max}
                        onChange={(event) => setMin(event.target.value)}
                        defaultValue={min || 0}
                        required
                        readOnly={question}
                    />
                    <Form.Control.Feedback type="invalid">Insert a number between 0 and {options.length}</Form.Control.Feedback>

                </Form.Group>

                <Form.Group as={Col} sm={6} md={4} lg={3} controlId="formMaxNumberOptions">
                    <Form.Label>Maximum number of selectable options</Form.Label>
                    <Form.Control required type='number'
                        min={min > 1 ? min : 1}
                        max={options.length}
                        onChange={(event) => setMax(event.target.value < 1 ? 1 : event.target.value)}
                        defaultValue={max || 1}
                        readOnly={question}
                    />
                    <Form.Control.Feedback type="invalid">Insert a number between 1 and {options.length}</Form.Control.Feedback>

                </Form.Group>

            </Form.Row>

        </>

    );
}
const OpenQuestion = (props) => {
    const { min, setMin, question } = props;
    return (
        <>
            <Form.Control as="textarea" readOnly placeholder="Users will write something here.." />
            <Form.Check
                type="switch"
                id={question ? question.id : "newID"}
                checked={min || 0}
                label="Required"
                disabled={question}
                onChange={() => (min ? setMin(0) : setMin(1))}
            />
        </>
    );
}

export default CreationSurveyForm;