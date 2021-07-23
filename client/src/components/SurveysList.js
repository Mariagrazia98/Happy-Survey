
import { Button, ListGroup, Col, Row } from "react-bootstrap";
import { Link } from 'react-router-dom';
import { FaUserPlus } from "react-icons/fa";

const SurveysList = (props) => {
  const { loggedIn, surveys } = props;



  return (

    <Col sm="8">
      {surveys.length > 0 ? <h1 className="font-italic text-center mb-3"> {loggedIn ? "Your" : ""} Surveys</h1> : <></>}
      <ListGroup as="ul" variant="flush" className="mt-2">
        {
          surveys.map(s => {
            return (
              <ListGroup.Item as="li" key={s.id}>
                <SurveyRowData survey={s} loggedIn={loggedIn} />
              </ListGroup.Item>
            );
          })
        }
        {surveys.length === 0 ? <h1 className="text-center">There are not any survey yet</h1> : <></>}
      </ListGroup>
    </Col>


  )
};

const SurveyRowData = (props) => {
  const { loggedIn, survey } = props;

  return (
    <>
      <Row className="justify-content-between">
        <h3 className="font-italic">{survey.title}</h3>
        <Row className="justify-content-end">
          {loggedIn ?
            <>
              <Col sm="3">
                <FaUserPlus size={30}></FaUserPlus> <Row > {survey.nSubmissions} users </Row>

              </Col>
              <Col sm="9">

                <Link
                  to={{
                    state: { survey: survey },
                    pathname: "/surveys/" + survey.id + "/submissions",
                  }}>
                  <Button variant="primary" disabled={survey.nSubmissions === 0}>View answers</Button> </Link>
              </Col>
            </>
            : <Link
              to={{
                pathname: "/surveys/" + survey.id,
                state: { survey: survey },
              }}><Button variant="primary">Fill in</Button>
            </Link>
          }



        </Row>

      </Row >
      {survey.description ? <Col sm="8">{survey.description}</Col> : ""}
    </>
  )
}
export default SurveysList;