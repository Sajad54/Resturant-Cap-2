import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { postReservation, readReservation, putReservation } from "../utils/api";
import ErrorAlert from "../layout/ErrorAlert";

function formatPhoneNumber(value) {
    // if input value is falsy eg if the user deletes the input, then just return
    if (!value) return value;
  
    // clean the input for any non-digit values.
    const phoneNumber = value.replace(/[^\d]/g, "");
  
    // phoneNumberLength is used to know when to apply our formatting for the phone number
    const phoneNumberLength = phoneNumber.length;
  
    // we need to return the value with no formatting if its less then four digits
    // this is to avoid weird behavior that occurs if you  format the area code to early
    if (phoneNumberLength < 4) return phoneNumber;
  
    // if phoneNumberLength is greater than 4 and less the 7 we start to return
    // the formatted number
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    // finally, if the phoneNumberLength is greater then seven, we add the last
    // bit of formatting and return it.
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(
      3,
      6
    )}-${phoneNumber.slice(6, 10)}`;
  }

export default function ReservationForm({ reservation_id }) {
    const initialFormState = {
        first_name: "",
        last_name: "",
        mobile_number: "",
        reservation_date: "",
        reservation_time: "",
        people: "",
    }

    const [form, setForm] = useState({...initialFormState});
    const [reservationsError, setReservationsError] = useState([]);
    // const [phonevalue, setPhoneValue] = useState("");
   
    const history = useHistory();

    // if "edit" usage of form, load data for reservation_id
    useEffect(() => {
        const abortController = new AbortController();

        if (reservation_id) {
            async function loadReservation() {
                try {
                    const reservation = await readReservation(reservation_id, abortController.status);
                    setForm(reservation);
                } catch (error) {
                    setReservationsError([error.message]);
                }
            }
            loadReservation();
        }
        return () => abortController.abort();
    }, [reservation_id]);

    const handleChange = ({ target }) => {
        let name = target.name;
        let value = target.value;
                        
        // check that reservation date is not on a Tuesday and / or not in the past
        if (name === "reservation_date") {
            const date = new Date(`${value} PDT`);
            const reservation = date.getTime();
            const now = Date.now();

            if (date.getUTCDay() === 2 && reservation < now) {
                setReservationsError([
                    "The restaurant is closed on Tuesday.", 
                    "Reservation must be in the future."
                ]);
            } else if (date.getUTCDay() === 2) {
                setReservationsError(["The restaurant is closed on Tuesday."]);
            } else if (reservation < now) {
                setReservationsError(["Reservation must be in the future."]);
            } else {
                setReservationsError([]);
            }
        }

        // check that reservation time is during open hours
        if (name === "reservation_time") {
            const open = 1030;
            const close = 2130;
            const reservation = value.substring(0, 2) + value.substring(3);
            if (reservation > open && reservation < close) {
                setReservationsError([]);
            } else {
                setReservationsError(["Reservations are only allowed between 10:30am and 9:30pm."]);
            }
        }

        if (name === "mobile_number") {
            // this is where we'll call the phoneNumberFormatter function
            form.mobile_number = formatPhoneNumber(value);
            console.log('formatPhoneNumber(value) line 106: ', formatPhoneNumber(value));
            console.log('form.mobile_number line 107: ', form.mobile_number);
        };
        // set the form state
        setForm({
            ...form,
            [target.name]: target.value,
        });
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        const abortController = new AbortController();

        // POST request (new reservation)
        if (!reservation_id) {
            async function postData() {
                try {
                    await postReservation(form, abortController.signal);
                    history.push(`/dashboard?date=${form.reservation_date}`);
                } catch (error) {
                    setReservationsError([...reservationsError, error.message]);
                }
            }
            // do not send POST request if there is a pending error message
            if (reservationsError.length === 0) {
                postData();
            }
        }
        // PUT request (edit reservation)
        if (reservation_id) {
            async function putData() {
                try {
                    setReservationsError([]);
                    await putReservation(form, abortController.signal);
                    history.push(`/dashboard?date=${form.reservation_date}`);
                } catch (error) {
                    setReservationsError([...reservationsError, error.message]);
                }
            }
            // do not send PUT request if there is a pending error message
            if (reservationsError.length === 0) {
                putData();
            }
        } 
    }
    return (
            <>
            <ErrorAlert error={reservationsError} />
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="first_name">First Name</label>
                    <input 
                        className="form-control"
                        type="text"
                        name="first_name"
                        id="first_name"
                        placeholder="First Name"
                        onChange={handleChange}
                        required="required"
                        value={form.first_name}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="last_name">Last Name</label>
                    <input 
                        className="form-control"
                        type="text"
                        name="last_name"
                        id="last_name"
                        placeholder="Last Name"
                        onChange={handleChange}
                        required="required"
                        value={form.last_name}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="mobile_number">Mobile Phone Number</label>
                    <input 
                        className="form-control"
                        type="tel"
                        pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                        name="mobile_number"
                        id="mobile_number"
                        placeholder="555-555-5555"
                        onChange={handleChange}
                        required="required"
                        value={form.mobile_number}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="reservation_date">Reservation Date</label>
                    <input 
                        className="form-control"
                        type="date"
                        name="reservation_date"
                        id="reservation_date"
                        onChange={handleChange}
                        required="required"
                        value={form.reservation_date}
                    />
                </div>
                <div className="form-group">
                <label htmlFor="reservation_time">Reservation Time</label>
                    <input 
                        className="form-control"
                        type="time"
                        name="reservation_time"
                        id="reservation_time"
                        onChange={handleChange}
                        required="required"
                        value={form.reservation_time}
                    /> 
                </div>
                <div className="form-group">
                    <label htmlFor="people">Number of People in Party</label>
                    <input 
                        className="form-control"
                        type="number"
                        name="people"
                        id="people"
                        onChange={handleChange}
                        required="required"
                        value={form.people}
                    />
                </div>
                <button className="btn btn-dark" type="submit">Submit</button>
                <button className="btn btn-dark mx-3" type="button" onClick={() => history.goBack()}>Cancel</button>
            </form>
        </>
    );

}



