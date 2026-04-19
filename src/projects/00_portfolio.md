# Portfolio Website

![a mockup of the portfolio website UI in figma](/Portfolio_Mockup.png)

## Links: https://seanpletan.net /blog/portfolio

subheading: This is a mockup picture made in figma. Previously, I wanted to use a monolith.

summary: This is the website you're on now! I used Three.js, WebGL shaders, vanilla JavaScript, vanilla CSS, HTML, Vite + Rolldown, and Apache HTTP Server to build and deploy it. I wanted the grass to mimic Ghost of Tsushima's grass system, while still being usable, and I wanted to UI to be lightweight and air-y in order to accentuate the 3D scene that it lives in. The 3D scene uses a custom lighting workflow and does not use vanilla Three.js built-in lighting features.

<!--BLOG SECTION BELOW-->

I think having a record of what you're capable of at any point in time is massively useful. It lets you compare what you are to what you were, including where you thought where you were going. A bit like a technical diary. To that end, I've created a personal portfolio website. I hope it showcases what I am capable of and a little bit of who I am. This blog is about the development story of this site.

This blog is divided into three sections: Shader Trickery and 3D Workflow, Website Design, and Issues and Limitations.

# 1: Shader Trickery

## 1.1: Overview

So you've probably deduced that the background is a Three.js scene. As of writing (April 14, 2026), it is held entirely within a 300 x 300 plane geometry, with the y vector being modified by my shader pipeline. On top of the plane geometry I have rendered 270,000 grass blades. Each blade of grass has 
12 verts, and the entire terrain has 1,024 verts. The model is just to provide some visual center to the scene, and doesn't really mean anything. On each frame, 4 shader programs are ran: the grass' fragment and vertex shader, and the terrain's fragment and vertex shader. Small amounts of postprocessing is done using an SMAA pass.

## 1.2: Grass Construction

