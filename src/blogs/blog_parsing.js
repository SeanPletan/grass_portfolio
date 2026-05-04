export function findBlogContent(path, json) {
     for (let i = 0; i < json.length; i++) {
          for (let j = 0; j < json[i].links.length; j++)
               if (path == json[i].links[j]) {
                    return json[i];
               }
     }
     return null;
}

export function renderBlogPage(jsonObject) {
     const blog = document.createElement('div');
     blog.id = "blog";

     const blogHeading = document.createElement('div');
     blogHeading.id = "blog-heading";

     const titleElem = document.createElement('h1');
     titleElem.innerText = jsonObject.title;// + " Blog";
     blogHeading.appendChild(titleElem);
     blog.appendChild(blogHeading);

     const fullscreen = document.createElement('div');
     fullscreen.className = "icon";
     fullscreen.id = "fullscreen";
     fullscreen.dataset.action = "minimize-maximize";


     // const summary = document.createElement('p');
     // summary.id = "blog-summary"
     // summary.textContent = jsonObject.summary;
     // blog.appendChild(summary);


     const metadata = document.createElement('div');
     metadata.id = "metadata";

     const byImgContainer = document.createElement('div');
     byImgContainer.id = "by-img-container";

     const byLine = document.createElement('p');
     byLine.id = "by";
     byLine.innerText = "By Sean"

     const byImg = document.createElement('img');
     byImg.id = "by-img";
     byImg.src = "/20260313_134402.jpg";
     byImgContainer.appendChild(byImg);
     byImgContainer.appendChild(byLine);
     metadata.appendChild(byImgContainer);

     if (jsonObject.links?.length) {
          const linksContainer = document.createElement('div');
          linksContainer.className = 'links-container';
          const icons = createLinkIcons(jsonObject.links);
          linksContainer.appendChild(icons);
          metadata.appendChild(linksContainer);
     }

     const dates = document.createElement('div');
     dates.id = "blog-dates";

     const publishedLine = document.createElement('p');
     publishedLine.innerText = "Published: " + jsonObject.published;
     dates.appendChild(publishedLine);

     const editedLine = document.createElement('p');
     editedLine.innerText = "Last Edited: " + jsonObject.edited;
     dates.appendChild(editedLine);

     byLine.appendChild(dates);
     blog.appendChild(metadata);







     const fullscreenImg = document.createElement("img");
     fullscreenImg.src = "/maximize.svg";
     fullscreenImg.width = 20;
     fullscreenImg.height = 20;
     fullscreen.appendChild(fullscreenImg);
     blogHeading.appendChild(fullscreen);

     const imgElem = document.createElement('img');
     imgElem.id = "blog-main-image";
     imgElem.src = jsonObject.imageSrc;
     imgElem.alt = jsonObject.imageTitle;
     blog.appendChild(imgElem);

     const subheading = document.createElement('div');
     subheading.id = "blog-subheading";

     const subheadingLine = document.createElement('p');
     subheadingLine.innerText = jsonObject.subheading;
     subheading.appendChild(subheadingLine)

     blog.appendChild(subheading);




     const bodyElem = document.createElement('div');
     bodyElem.id = "blog-body";
     blog.appendChild(bodyElem);

     return blog;
}


function getLinkMeta(url) {
     if (url.includes("github.com")) {
          return {
               label: "GitHub",
               icon: "/github.svg"
          };
     }

     else if (url.includes("http")) {
          return {
               label: "Live Site",
               icon: "/arrow-out-up-right-circle.svg"
          };
     }

     // fallback
     return {
          label: "Blog",
          icon: "/article.svg"
     };
}

function createLinkIcons(urls) {
     const container = document.createElement("div");
     container.className = "link-icon-container";


     for (let url = 0; url < urls.length; url++)
     {
          const { label, icon } = getLinkMeta(urls[url]);

          if (label == "Blog")
               break;

          const wrapper = document.createElement("div");
          wrapper.className = "blog-link-icon";

          const link = document.createElement("a");
          link.href = urls[url];
          link.className = "blog-reveal-btn route";

          const labelEl = document.createElement("div");
          labelEl.className = "blog-label";
          labelEl.textContent = label;

          const img = document.createElement("img");
          img.src = icon;
          img.width = 20;
          img.height = 20;

          link.append(labelEl, img);
          wrapper.appendChild(link);
          container.appendChild(wrapper);
     };

     return container;
}


// export function renderBlogCard(jsonObject) {
//      const container = document.getElementById('blog-container');
//      if (!container) return;

//      const cardAndLineContainer = document.createElement('div');
//      cardAndLineContainer.className = "card-and-line-container";


//      const blogCard = document.createElement('a');
//      blogCard.className = "blog-card route"
//      for (let xx = 0; xx < jsonObject.links.length; xx++)
//      {
//           if (jsonObject.links[xx].includes("/blog"))
//                blogCard.href = jsonObject.links[xx];
//      }


//      const blogCardText = document.createElement('div');
//      blogCardText.className = "blog-card-text";

//      const blogCardTitle = document.createElement('h2');
//      blogCardTitle.className = 'blog-card-title';
//      blogCardTitle.innerText = jsonObject.title;

//      const blogCardImg = document.createElement('img');
//      blogCardImg.className = 'blog-card-img';
//      blogCardImg.src = jsonObject.imageSrc;
//      blogCardImg.alt = jsonObject.imageTitle;

//      const blogCardSummary = document.createElement('p');
//      blogCardSummary.className = 'blog-card-summary';
//      blogCardSummary.innerText = jsonObject.summary;

//      blogCardText.appendChild(blogCardTitle);
//      blogCardText.appendChild(blogCardSummary);

//      blogCard.appendChild(blogCardText);
//      blogCard.appendChild(blogCardImg);

//      cardAndLineContainer.appendChild(blogCard);


//      const horizontalLine = document.createElement('div');
//      horizontalLine.className = "horizontal-line";
//      cardAndLineContainer.appendChild(horizontalLine);

//      container.appendChild(cardAndLineContainer);

// }