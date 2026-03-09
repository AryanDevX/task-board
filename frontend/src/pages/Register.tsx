import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

//Extending FormElements by usernameInput and passwordInput and specifying their types.
interface FormElements extends HTMLFormControlsCollection {
  emailInput: HTMLInputElement;
  usernameInput: HTMLInputElement;
  passwordInput: HTMLInputElement;
}

export const Register = () => {
  const navigate = useNavigate();

  // const [isLoading, setIsLoading] = useState<boolean>(false);
  // const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // setIsLoading(true);
    // setErrorMessage(null);
    const elements = event.currentTarget.elements as FormElements;
    //Pulling the values from typed elements:
    const email = elements.emailInput.value;
    const username = elements.usernameInput.value;
    const password = elements.passwordInput.value;

    // try{
    //     //ROHIT: Set it up according to backend.
    //     await new Promise((resolve) => setTimeout(resolve, 1500));
    //     // if(username == "unregistered_user"){
    //     //     throw new Error("User not found in the database. Please register first.")
    //     // }
    //     navigate('/dashboard');
    // }
    // catch(err:any){
    //     setErrorMessage(err.message || "Invalid credentials.");
    // }
    // finally {
    //    setIsLoading(false);
    // }

    console.log('Wait we are registering you.');
  };
  return (
    <div className="login-box">
      <h2>Task Board Register</h2>
      {/* {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>} */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="emailInput">Email: </label>
          <input id="emailInput" name="emailInput" type="text" required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="usernameInput">Username: </label>
          <input id="usernameInput" name="usernameInput" type="text" required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="passwordInput">Password: </label>
          <input
            id="passwordInput"
            name="passwordInput"
            type="password"
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};
