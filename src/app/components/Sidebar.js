'use client';
import { useState, useRef } from "react";
import style from "../homepage.module.scss";
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside>
      <ul className={style.sidebar}>
        <li><Link href="/like"><img src="/unlike.png"></img>Likes</Link></li>
        <li><Link href="/upload"><img src="/upload.png"></img>Upload</Link></li>
        <li><Link href="/playlists"><img src="/playlists.png"></img>Playlists</Link></li>
        <li><Link href="/about"><img src="/about.png"></img>About</Link></li>
      </ul>
    </aside>
  );
}
