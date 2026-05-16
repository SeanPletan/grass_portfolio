import * as scene from './scene.js';
import markdownit from "markdown-it";
import * as projectParsing from "./projects/project_parsing";
import * as blogParsing from "./blogs/blog_parsing";
import getAboutMePage from "./routes/about.md?raw";
import getProjectsPage from "./routes/projects.md?raw";
import getContactPage from "./routes/contact.md?raw";
import get404Page from "./routes/404.md?raw";
// import getBlogPage from "./routes/blog.md?raw";


// if (window.innerWidth <= 768) {
//      document.body.innerHTML = `
//     <div style="
//       height:100vh;
//       display:flex;
//       align-items:center;
//       justify-content:center;
//       flex-direction: column;
//       text-align:center;
//       font-size:20px;
//       padding-left: 20px;
//       padding-right: 20px;
//       color: white;
//       background-color: black;
//       font-family: inter;
//     ">
//       <p>Unfortunately, this website does not yet support mobile usage.</p>
//       <p>The 3D scene is pretty resource intensive (very, very laggy on mobile devices), and responsiveness has not yet been implemented.</p>
//       <p>Please use a PC to access my page. Sorry for the inconvenience!</p>
//       <p>I’m working on it right now!</p>
//       <p> -Sean </p>
//     </div>
//   `;
// }

const scrollTarget = document.getElementById("webgl");
const canvas = document.querySelector("canvas.webgl");
const nav = document.getElementById("nav");
const name = document.getElementById("name");
const overlay = document.getElementById("overlay");
const cards = document.getElementsByClassName("project-card");
let blogSelector = null;

const sceneCtx = scene.makeScene();
let appState = {
     paused: false,
     uiShown: false,
     uiShownFullscreenOverruled: false,
     scrollValue: 0,
     threshold: 0.5
};
const overlayState = {
     mode: "hidden", // "hidden" | "panel" | "expanded"
     currentView: "/", // "/", "/about", "/projects", "/blog", etc.
};

let json = [];
let jsonLoaded = false;
const markdownFiles = import.meta.glob('./projects/*.md', { query: 'raw' });

async function loadAllMarkdown() {
     const result = {};
     for (const projectBlog in markdownFiles) {
          result[projectBlog] = await markdownFiles[projectBlog]();
     }
     return result;
}




function createScrollHelperText() {
     const scrollHelper = document.createElement("h2");
     scrollHelper.id = "scroll-helper"
     scrollHelper.classList = "glass-card hide-scroll-helper";
     scrollHelper.textContent = "scroll down to see page content..."
     document.body.appendChild(scrollHelper);
}

function toggleScrollHelperText() {
     const scrollHelper = document.getElementById("scroll-helper");
     if (!scrollHelper || appState.scrollValue > appState.threshold) {
          return;
     }

     if (scrollHelper.classList.contains("show-scroll-helper")) {
          scrollHelper.classList.remove("show-scroll-helper");
          scrollHelper.classList.add("hide-scroll-helper");
     } else {
          scrollHelper.classList.add("show-scroll-helper");
          scrollHelper.classList.remove("hide-scroll-helper");
     }
}

createScrollHelperText();


function ensureScrolled() {
     if (appState.scrollValue < appState.threshold)
          appState.scrollValue = 1.0;

     return appState.scrollValue
}

function renderOverlayState() {
     overlay.classList.remove("overlay--hidden", "overlay--panel", "overlay--expanded");
     overlay.classList.add(`overlay--${overlayState.mode}`);

     if (overlayState.mode === "expanded") 
          //this is for setting a flag that removes "uiShown" to nav and name 
          //whFren the overlay is expanded
          appState.uiShownFullscreenOverruled = true;
     else
          appState.uiShownFullscreenOverruled = false;

     const icon = document.querySelector('[data-action="minimize-maximize"]');
     if (icon) {
          const img = icon.querySelector("img");
          if (overlayState.mode === "expanded") {
               icon.dataset.fullscreen = true;
               img.src = "/minimize.svg";
          }
          else {
               icon.dataset.fullscreen = false;
               img.src = "/maximize.svg"
          }
     }

     // --------- rendering per route for expanded vs panel below ---------- //
     if (overlayState.mode === "expanded"){
          if (overlayState.currentView === "/projects") {
               for (let card of cards)
                    card.className = "project-card project-card--expanded" ;              
          }
          else if (overlayState.currentView === "/blog") {
               
          }
          else if (overlayState.currentView.startsWith("/blog")) {
               let blogSelector = document.getElementById("blog");
               blogSelector.className = "blog--expanded";
          }
     }

     else if (overlayState.mode === "panel") {
          if (overlayState.currentView === "/projects") {
               for (let card of cards)
                    card.className = "project-card";
          }
          else if (overlayState.currentView === "/blog") {

          }
          else if (overlayState.currentView.startsWith("/blog")) {
               let blogSelector = document.getElementById("blog");
               blogSelector.className = "blog--panel";
          }
     }

}

async function handleRouteChange() {
     const path = overlayState.currentView = window.location.pathname;
     let view;
     const md = markdownit({
          html: true,
          linkify: true,
          typographer: true,
          breaks: true,
     });

     // Ensure projects are loaded before rendering
     if (!jsonLoaded) {
          const all_md = await loadAllMarkdown();
          for (const projectBlog in all_md) {
               json.push(projectParsing.projectParser(all_md[projectBlog].default));
          }
          jsonLoaded = true;
     }


     

     handleOverlayStateMode(false);

     if (path === "/about") {
          view = md.render(getAboutMePage);
          document.getElementById("overlay-content").innerHTML = view;
          ensureScrolled();
     } else if (path === "/projects") {
          view = md.render(getProjectsPage);
          document.getElementById("overlay-content").innerHTML = view;
          for (let xxx of json) {
               projectParsing.renderProjectCard(xxx)
          }

          ensureScrolled();
          document.querySelectorAll(".route").forEach((link) => {
               link.addEventListener("click", function (e) {
                    // Check if the link is external (not part of your SPA)
                    const isExternal = this.hostname !== window.location.hostname;

                    if (isExternal) {
                         // Open external links in a new tab
                         window.open(this.href, "_blank");
                         e.preventDefault(); // Prevent SPA routing logic for external links
                         return;
                    }

                    // For internal links, handle routing in your SPA
                    e.preventDefault();
                    history.pushState(null, "", this.href);
                    handleRouteChange();
               });
          });
     // } else if (path === "/blog") {
     //      view = md.render(getBlogPage); // Handle /blog exactly
     //      document.getElementById("overlay-content").innerHTML = view;
     //      for (let xxx of json) {
     //           if (xxx.blog)
     //                blogParsing.renderBlogCard(xxx)
     //      }


     //      ensureScrolled();

     //      document.querySelectorAll(".route").forEach((link) => {
     //           link.addEventListener("click", function (e) {
     //                // Check if the link is external (not part of your SPA)
     //                const isExternal = this.hostname !== window.location.hostname;

     //                if (isExternal) {
     //                     // Open external links in a new tab
     //                     window.open(this.href, "_blank");
     //                     e.preventDefault(); // Prevent SPA routing logic for external links
     //                     return;
     //                }

     //                // For internal links, handle routing in your SPA
     //                e.preventDefault();
     //                history.pushState(null, "", this.href);
     //                handleRouteChange();
     //           });
     //      });
     } else if (path.startsWith("/blog")) {
          const blogObject = blogParsing.findBlogContent(path, json);
          const blogBody = md.render(blogObject.blog);
          view = blogParsing.renderBlogPage(blogObject); // Handle /blog/[subpath]
          document.getElementById("overlay-content").innerHTML = "";
          document.getElementById("overlay-content").appendChild(view);
          document.getElementById("blog-body").innerHTML = blogBody;
          ensureScrolled();
     } else if (path === "/contact") {
          view = md.render(getContactPage);
          document.getElementById("overlay-content").innerHTML = view;
          ensureScrolled();
     } else if (path !== "/") {
          // Default case for 404
          view = md.render(get404Page);
          document.getElementById("overlay-content").innerHTML = view;
          ensureScrolled();
     }
     renderOverlayState();

     let spacer = document.createElement("div");
     spacer.className = "spacer"
     document.getElementById("overlay-content").appendChild(spacer);
     document.getElementById("overlay-content").scrollTop = 0;

     if (appState.scrollValue < appState.threshold) {
          window.setTimeout(toggleScrollHelperText, 3000)
     }
}


function handleOverlayStateMode(fullscreenButtonPushed) {
     if (fullscreenButtonPushed) {
          overlayState.mode = overlayState.mode === "expanded" ? "panel" : "expanded";
          renderOverlayState();     //re-render the overlay when fullscreen button is pushed
          if (overlayState.mode === "expanded")
          {
               appState.paused = true;
               sceneController.pause();          
          }
          if (overlayState.mode === "panel") {
               appState.paused = false;
               sceneController.resume();
          }
     }
     else if (overlayState.currentView === "/")
          overlayState.mode = "hidden";
     else if (overlayState.mode === "hidden")
          overlayState.mode = "panel"; 

     //otherwise (eg. /projects -> /blog), do nothing (ie. keep same overlayState mode)
}


handleRouteChange();

window.addEventListener("popstate", handleRouteChange);

document.querySelectorAll(".route").forEach((link) => {
     link.addEventListener("click", function (e) {
          // Check if the link is external (not part of your SPA)
          const isExternal = this.hostname !== window.location.hostname;

          if (isExternal) {
               // Open external links in a new tab
               window.open(this.href, "_blank");
               e.preventDefault(); // Prevent SPA routing logic for external links
               return;
          }

          // For internal links, handle routing in your SPA
          e.preventDefault();
          history.pushState(null, "", this.href);
          handleRouteChange();
     });
});

window.addEventListener("wheel", (event) => {
     if (event.target == scrollTarget) {
          appState.scrollValue += event.deltaY * 0.0008;
          appState.scrollValue = Math.min(Math.max(appState.scrollValue, 0), 1);
     }
});

canvas.addEventListener("click", () => {
     history.pushState(null, "", "/");
     handleRouteChange();
});

document.addEventListener("click", function (e) {
     const icon = e.target.closest("[data-action]");


     if (!icon)
          return;

     if (icon.dataset.action === "minimize-maximize")
          handleOverlayStateMode(true);
});





const sceneController = scene.startSceneTick(sceneCtx, appState, {
     nav,
     name
});