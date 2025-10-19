'use client';
import { useState, useRef } from "react";
import Image from "next/image";
import layout from "../homepage.module.css"
import style from "./search.module.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import clsx from "clsx";

export default function Upload() {

    return (
        <div className={clsx(layout.background)}>
            <Header />
            <Sidebar />
            <main className={clsx(layout.main)}>
                <section className={style.topResults}>
                    <h2>Top Results</h2>
                    <div className={style.topResultsContainer}>
                        <div className={style.topResultItem}>
                            <Image src="/albumcover.jpg" width={150} height={150} alt="Top Result Album" />
                            <button className={clsx(style.playButton)}>Play</button>
                            <div className={style.topResultInfo}>
                                <h3>ABC</h3>
                                <p>Artist Name</p>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}



