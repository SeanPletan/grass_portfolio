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

     const blogHeading = document.createElement('div');
     blogHeading.className = "blog-heading";

     const titleElem = document.createElement('h1');
     titleElem.innerText = jsonObject.title;
     blogHeading.appendChild(titleElem);
     blog.appendChild(blogHeading);

     const imgElem = document.createElement('img');
     imgElem.className = "blog-main-image";
     imgElem.src = jsonObject.imageSrc;
     imgElem.alt = jsonObject.imageTitle;
     blog.appendChild(imgElem);

     const bodyElem = document.createElement('div');
     bodyElem.id = "blog-body";
     blog.appendChild(bodyElem);

     //console.log(blog)
     return blog;
}
