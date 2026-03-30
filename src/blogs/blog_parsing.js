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
     // blog.className = "blog--panel"; //bad

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


export function renderBlogCard(jsonObject) {
     const container = document.getElementById('blog-container');
     if (!container) return;


     const blogCard = document.createElement('a');
     blogCard.className = "blog-card route"
     blogCard.href = jsonObject.links[2];

     const blogCardText = document.createElement('div');
     blogCardText.className = "blog-card-text";

     const blogCardTitle = document.createElement('h2');
     blogCardTitle.className = 'blog-card-title';
     blogCardTitle.innerText = jsonObject.title;

     const blogCardImg = document.createElement('img');
     blogCardImg.className = 'blog-card-img';
     blogCardImg.src = jsonObject.imageSrc;
     blogCardImg.alt = jsonObject.imageTitle;

     const blogCardSummary = document.createElement('p');
     blogCardSummary.className = 'blog-card-summary';
     blogCardSummary.innerText = jsonObject.summary;

     blogCardText.appendChild(blogCardTitle);
     blogCardText.appendChild(blogCardSummary);

     blogCard.appendChild(blogCardText);
     blogCard.appendChild(blogCardImg);

     container.appendChild(blogCard);


     const horizontalLine = document.createElement('div');
     horizontalLine.className = "horizontal-line";
     container.appendChild(horizontalLine);

}


export function filterBlogCards(arrayOfJsonObjects) {
     return 0;

}