"use client";
import styles from "./Account.module.css";
import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";

function User() {
    const [firstNameInput, setFirstNameInput] = useState("");
    const [lastNameInput, setLastNameInput] = useState("");
    const [cityInput, setCityInput] = useState("");
    const [countryInput, setCountryInput] = useState("");
    const [bioInput, setBioInput] = useState("");

    const handleFirstNameInput = (e) => setFirstNameInput(e.target.value)
    const hadnleLastNameInput = (e) => setLastNameInput(e.target.value)
    const handleCityInput = (e) => setCityInput(e.target.value)
    const handleCountryInput = (e) => setCountryInput(e.target.value)
    const handleBioInput = (e) => setBioInput(e.target.value)

    return (
        <>
            <h2 className={clsx(styles["user-title"])}>Information</h2>
            <div className={clsx(styles["user-wrapper"])}>
                <form className={clsx(styles["user-form-wrapper"])}>
                    <div className={clsx(styles["user-form-group"])}>
                        <label className={clsx(styles["user-form-label"])} htmlFor="nickname">
                            Display name <span>*</span>
                        </label>
                        <input
                            className={clsx(styles["user-form-input"], styles["deactivate"])}
                            value={"LMKgaming"}
                            id="nickname"
                            onChange={() => {}}
                        />
                    </div>
                    <div className={clsx(styles["user-form-group"])}>
                        <label className={clsx(styles["user-form-label"])} htmlFor="first-name">
                            First Name
                        </label>
                        <input className={clsx(styles["user-form-input"])} id="first-name" value={firstNameInput} onChange={handleFirstNameInput}/>
                    </div>
                    <div className={clsx(styles["user-form-group"])}>
                        <label className={clsx(styles["user-form-label"])} htmlFor="last-name">
                            Last Name
                        </label>
                        <input className={clsx(styles["user-form-input"])} id="last-name" value={lastNameInput} onChange={hadnleLastNameInput}/>
                    </div>
                    <div className={clsx(styles["user-form-group"])}>
                        <label className={clsx(styles["user-form-label"])} htmlFor="city">
                            City
                        </label>
                        <input className={clsx(styles["user-form-input"])} id="city" value={cityInput} onChange={handleCityInput}/>
                    </div>
                    <div className={clsx(styles["user-form-group"])}>
                        <label className={clsx(styles["user-form-label"])} htmlFor="country">
                            Country
                        </label>
                        <input className={clsx(styles["user-form-input"])} id="country" value={countryInput} onChange={handleCountryInput}/>
                    </div>
                    <div className={clsx(styles["user-form-group"])}>
                        <label className={clsx(styles["user-form-label"])} htmlFor="bio">
                            Bio
                        </label>
                        <div className={clsx(styles["user-form-text"])}>
                            <textarea
                                value={bioInput}
                                onChange={handleBioInput}
                                id="bio"
                                className={clsx(styles["user-form-textarea"])}
                                placeholder="Tell the world a little bit about yourself. The shorter the better."
                            ></textarea>
                        </div>
                    </div>
                    <div className={clsx(styles["user-form-group"])}>
                        <button className={clsx(styles["user-form-submit"])}>Save changes</button>
                    </div>
                </form>
                <div className={clsx(styles["user-image-wrapper"])}>
                    <Image
                        src={"/background.jpg"}
                        width={100}
                        height={100}
                        alt=""
                        className={clsx(styles["user-image"])}
                    />
                    <button className={clsx(styles["user-image-btn"])}>Upload Image</button>
                </div>
            </div>
        </>
    );
}

export default User;
