import { Navbar, Button, Nav } from "react-bootstrap";
import { RiSurveyLine } from "react-icons/ri";
import { Link } from 'react-router-dom';

const Navigation = (props) => {
    const { loggedIn } = props;

    return (
        <Navbar bg="light" fixed="top" className="justify-content-between" >
            <Navbar.Brand className='mx-3' >
                <Link
                className="text-dark text-decoration-none " 
                    to={"/surveys"} ><RiSurveyLine size="30" />  HAPPY SURVEY
                </Link>

            </Navbar.Brand>
            <>
                {loggedIn ? <> <Nav className="mx-auto">
                    <Link
                        to={"/createSurvey"}> <Button variant="light" className="mr-4 mt-1">
                            Create a survey
                        </Button>
                    </Link>
                    <Link
                        to={"/surveys"}> <Button variant="light" className="mr-4 mt-1">
                            Show results
                        </Button>
                    </Link>
                </Nav>
                    <Button variant='outline-dark' onClick={props.doLogout} className='mx-3'>Logout</Button> </>

                    : (
                        <Link to={'/login'}>
                            <Button variant='outline-primary' className='mx-3'>Login</Button>
                        </Link>

                    )}
            </>
        </Navbar>


    );
}

export default Navigation;
