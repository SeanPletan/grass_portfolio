export function findBlogContent(path, json) {
     for (let i = 0; i < json.length; i ++) {
          for (let j = 0; j < json[i].links.length; j ++)
               if (path == json[i].links[j]) {
                    return json[i];               
               }
     }
     return null;
}

export function renderBlogCard(jsonObject) {
     const blog = document.createElement('div');
     blog.id = "blog";
     // blog.className = "blog--panel"; //bad

     const blogHeading = document.createElement('div');
     blogHeading.id = "blog-heading";

     const titleElem = document.createElement('h1');
     titleElem.innerText = jsonObject.title;// + " Blog";
     blogHeading.appendChild(titleElem);
     blog.appendChild(blogHeading);

     const fullscreen = document.createElement("div");
     fullscreen.className = "icon";
     fullscreen.id = "fullscreen";
     fullscreen.dataset.action = "minimize-maximize";




     const fullscreenImg = document.createElement("img");
     fullscreenImg.src = "/maximize.svg";
     fullscreenImg.width = 20;
     fullscreenImg.height = 20;
     fullscreen.appendChild(fullscreenImg);
     blogHeading.appendChild(fullscreen)

     const imgElem = document.createElement('img');
     imgElem.id = "blog-main-image";
     imgElem.src = jsonObject.imageSrc;
     imgElem.alt = jsonObject.imageTitle;
     blog.appendChild(imgElem);

     const bodyElem = document.createElement('div');
     bodyElem.id = "blog-body";
     blog.appendChild(bodyElem);

     return blog;
}
