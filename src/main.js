import * as THREE from "three";
import * as scene from './scene.js';
import markdownit from "markdown-it";
import * as projectParsing from "./projects/project_parsing";
import * as blogParsing from "./blogs/blog_parsing";
import getAboutMePage from "./routes/about.md?raw";
import getProjectsPage from "./routes/projects.md?raw";
import getContactPage from "./routes/contact.md?raw";
import get404Page from "./routes/404.md?raw";
import getBlogPage from "./routes/blog.md?raw";

const sceneCtx = scene.makeScene();
let appState = {
     uiShown: false,
     scrollValue: 0,
     threshold: 0.5
};

let json = [];
const markdownFiles = import.meta.glob('./projects/*.md', { query: 'raw' });

async function loadAllMarkdown() {
     const result = {};
     for (const path in markdownFiles) {
          result[path] = await markdownFiles[path]();
     }
     return result;
}

loadAllMarkdown().then(all_md => {
     for (const path in all_md) {
          json.push(projectParsing.projectParser(all_md[path].default));
     }
});





const canvas = document.querySelector("canvas.webgl");
canvas.addEventListener("click", () => {
     history.pushState(null, "", "/");
     handleRouteChange();
     //tick();
});

function ensureScrolled() {
     if (appState.scrollValue < appState.threshold)
          appState.scrollValue = 1.0;

     return appState.scrollValue
}

function handleRouteChange() {
     const md = markdownit({
          html: true,
          linkify: true,
          typographer: true,
          breaks: true,
     });
     const path = window.location.pathname;
     let view;

     if (path === "/") {
          document.getElementById("overlay").classList.remove("overlay--panel");
          document.getElementById("overlay").classList.remove("overlay--expanded");
          document.getElementById("overlay").classList.add("overlay--hidden");
     } else if (path === "/about") {
          view = md.render(getAboutMePage);
          document.getElementById("overlay-content").innerHTML = view;
          document.getElementById("overlay").classList.remove("overlay--hidden");
          document.getElementById("overlay").classList.add("overlay--panel");
          ensureScrolled();
     } else if (path === "/projects") {
          view = md.render(getProjectsPage);
          document.getElementById("overlay-content").innerHTML = view;
          document.getElementById("overlay").classList.remove("overlay--hidden");
          document.getElementById("overlay").classList.add("overlay--panel");
          for (const projects in json)
               projectParsing.renderProjectCard(json[projects]);
          ensureScrolled();
          document.querySelectorAll(".route").forEach((link) => {
               link.addEventListener("click", function (e) {
                    e.preventDefault();
                    history.pushState(null, "", this.href);
                    handleRouteChange();
               });
          });
     } else if (path === "/blog") {
          // Handle exact /blog route
          view = md.render(getBlogPage); // Handle /blog exactly
          document.getElementById("overlay-content").innerHTML = view;
          document.getElementById("overlay").classList.remove("overlay--hidden");
          document.getElementById("overlay").classList.add("overlay--panel");
          ensureScrolled();
     } else if (path.startsWith("/blog")) {
          const blogObject = blogParsing.findBlogContent(path, json);
          const blogBody = md.render(blogObject.blog);
          view = blogParsing.renderBlogCard(blogObject); // Handle /blog/[subpath]
          document.getElementById("overlay-content").innerHTML = "";
          document.getElementById("overlay-content").appendChild(view);
          document.getElementById("blog-body").innerHTML = blogBody;
          document.getElementById("overlay").classList.remove("overlay--hidden");
          document.getElementById("overlay").classList.add("overlay--panel");
          ensureScrolled();
          //handleExpand();
     } else if (path === "/contact") {
          view = md.render(getContactPage);
          document.getElementById("overlay-content").innerHTML = view;
          document.getElementById("overlay").classList.remove("overlay--hidden");
          document.getElementById("overlay").classList.add("overlay--panel");
          ensureScrolled();
     } else {
          // Default case for 404
          view = md.render(get404Page);
          document.getElementById("overlay-content").innerHTML = view;
          document.getElementById("overlay").classList.remove("overlay--hidden");
          document.getElementById("overlay").classList.add("overlay--panel");
          ensureScrolled();
     }
}

handleRouteChange();

window.addEventListener("popstate", handleRouteChange);

document.querySelectorAll(".route").forEach((link) => {
     link.addEventListener("click", function (e) {
          e.preventDefault();
          history.pushState(null, "", this.href);
          handleRouteChange();
     });
});





const scrollTarget = document.getElementById("webgl");
window.addEventListener("wheel", (event) => {
     if (event.target == scrollTarget) {
          appState.scrollValue += event.deltaY * 0.0008;
          appState.scrollValue = Math.min(Math.max(appState.scrollValue, 0), 1);
     }
});





const timer = new THREE.Timer();
timer.connect(document);

const nav = document.getElementById("nav");
const name = document.getElementById("name");
const overlay = document.getElementById("overlay");
const cards = document.getElementsByClassName("project-card");
const blogSelector = document.getElementById("blog");



document.addEventListener("click", function (e) {
     const icon = e.target.closest("[data-action]");


     if (!icon) return;
     const img = icon.querySelector("img");
     const isFullscreen = icon.dataset.fullscreen === "true";
     const action = icon.dataset.action;
     if (action === "expand") {
          handleExpand();
     }

     if (!isFullscreen) {
          img.src = "/minimize.svg"
          icon.dataset.fullscreen = "true";
     }
     else {
          img.src = "/maximize.svg"
          icon.dataset.fullscreen = "false";
     }
});
let paused = false;


let expanded = false;
function handleExpand() {
     if (expanded == false) {
          overlay.classList.remove("overlay--panel");
          overlay.classList.add("overlay--expanded");

          nav.classList.remove("show-ui");
          name.classList.remove("show-ui");

          if (blogSelector) {
               blogSelector.classList.remove("blog--panel");
               blogSelector.classList.add("blog--expanded");          
          }
          appState.uiShown = false;

          for (let i = 0; i < cards.length; i++) {
               cards[i].classList.remove('project-card--expanded');
               cards[i].classList.add("project-card--small");
          }
          expanded = true;
          paused = true;
     } else {
          overlay.classList.remove("overlay--expanded");
          overlay.classList.add("overlay--panel");

          nav.classList.add("show-ui");
          name.classList.add("show-ui");

          if (blogSelector) {
               blogSelector.classList.add("blog--panel");
               blogSelector.classList.remove("blog--expanded");          
          }
          appState.uiShown = true;

          for (let i = 0; i < cards.length; i++) {
               cards[i].classList.add('project-card--expanded');
               cards[i].classList.remove("project-card--small");
          }
          expanded = false;
          paused = false;
          // timer.reset();
          // tick();
     }
}


scene.startSceneTick(sceneCtx, appState, {
     nav,
     name
});