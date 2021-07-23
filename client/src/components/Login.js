import { useState } from "react";
import { Form, Button, Col } from 'react-bootstrap';

const LoginForm = (props) => {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [validated, setValidated] = useState(false);

    const handleSubmit = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const credentials = { username, password };

        const form = event.currentTarget;

        if (!form.checkValidity()) {
            setValidated(true);
        }
        else if (username === '' || password === '' || password.length < 6) {
            props.setMessage({ msg: "Email cannot be empty and password must be at least six character long.", type: 'danger' })
            setValidated(true);
        }
        else {
            props.login(credentials).catch((err) => props.handleErrors(err));
        }
    };

    return (

        <Col sm="8" md="6" lg="3">
            <Form className='mx-auto mt-5' noValidate validated={validated} onSubmit={handleSubmit}>
                <Form.Group controlId="formBasicEmail">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control required type="email" placeholder="Enter email" value={username} onChange={ev => setUsername(ev.target.value)} />
                    <Form.Text className="text-muted">
                        We'll never share your email with anyone else.
                    </Form.Text>
                    <Form.Control.Feedback type="invalid">Please..insert an email</Form.Control.Feedback>
                </Form.Group>

                <Form.Group controlId="formBasicPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control required type="password" placeholder="Password" value={password} onChange={ev => setPassword(ev.target.value)} />
                    <Form.Control.Feedback type="invalid">Please..insert a password</Form.Control.Feedback>
                </Form.Group>

                <Button variant="primary" type="submit">
                    Submit
                </Button>
            </Form>
        </Col>

    )
}

export default LoginForm;