export function projectParser(md_raw) {
     const json = {};
     const lines = md_raw.split("\n");

     // --- Parse title, links, technologies, tags --- //
     for (let line of lines) {
          line = line.trim();

          // Title
          if (/^#\s+/.test(line)) {
               const match = line.match(/^#\s+(.*)/);
               if (match)
                    json.title = match[1];
               continue;
          }
          // Image
          if (/!\[([^\]]+)\]\([^)]+\)/.test(line)) {
               const match = line.match(/!\[([^\]]+)\]\(([^)]+)\)/);
               if (match) {
                    json.imageTitle = match[1];
                    json.imageSrc = match[2];
               }
               continue;
          }

          // Outside Links
          if (/^##\s+/.test(line)) {
               const matches = line.match(/https?:\/\/[^\s]+/g);
               if (matches)
                    json.links = matches;
          }

          if (/\/blog\S*/.test(line)) {
               const match = line.match(/\/blog\S*/);
               if (match)
                    json.links.push(match[0]);
               continue;
          }

          // Technologies
          if (/^###\s+/.test(line)) {
               const matches = line.match(/'([^']+)'/g);
               if (matches)
                    json.technologies = matches.map(tag => tag.replace(/^'|'$/g, ''));
               continue;
          }

          // Tags
          if (/^####\s+/.test(line)) {
               const matches = line.match(/'([^']+)'/g);
               if (matches)
                    json.tags = matches.map(tag => tag.replace(/^'|'$/g, ''));
               continue;
          }

          // Stop parsing when blog section starts
          if (line.includes('<!--BLOG SECTION BELOW-->'))
               break;
     }

     // --- Parse summary --- //
     const summaryLine = lines.find(line => line.toLowerCase().startsWith('summary:'));
     if (summaryLine) {
          json.summary = summaryLine.replace(/^summary:\s*/i, '');
     }

     // --- Parse publish date --- //
     const publishedLine = lines.find(line => line.toLowerCase().startsWith('published:'));
     if (publishedLine) {
          json.published = publishedLine.replace(/^published:\s*/i, '');
     }

     // --- Parse edited date --- //
     const editedLine = lines.find(line => line.toLowerCase().startsWith('last edited:'));
     if (editedLine) {
          json.edited = editedLine.replace(/^last edited:\s*/i, '');
     }

     // --- Parse subheading --- //
     const subheadingLine = lines.find(line => line.toLowerCase().startsWith('subheading:'));
     if (subheadingLine) {
          json.subheading = subheadingLine.replace(/^subheading:\s*/i, '');
     }

     // --- Parse blog (everything after blog marker) --- //
     const blogPart = md_raw.split('<!--BLOG SECTION BELOW-->')[1];
     if (blogPart) {
          json.blog = blogPart
     }

     return json;
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

     urls.forEach(url => {
          const { label, icon } = getLinkMeta(url);

          const wrapper = document.createElement("div");
          wrapper.className = "link-icon";

          const link = document.createElement("a");
          link.href = url;
          link.className = "reveal-btn route";

          const labelEl = document.createElement("div");
          labelEl.className = "label";
          labelEl.textContent = label;

          const img = document.createElement("img");
          img.src = icon;
          img.width = 20;
          img.height = 20;

          link.append(labelEl, img);
          wrapper.appendChild(link);
          container.appendChild(wrapper);
     });

     return container;
}


export function renderProjectCard(json) {
     if (!json)
          console.log("NO JSON!");
     const container = document.getElementById('projects-container');
     if (!container) return;

     const card = document.createElement('div');
     card.className = 'project-card';

     const cardTitle = document.createElement('div');
     cardTitle.className = 'card-title';

     const titleElem = document.createElement('h2');
     titleElem.textContent = json.title;
     cardTitle.appendChild(titleElem);

     //TODO: Re-Do this to dynamically assign a.textContent based on top-level domain name or, if it links to blog, just "Blog"
     if (json.links?.length) {
          const linksContainer = document.createElement('div');
          linksContainer.className = 'links-container';
          const icons = createLinkIcons(json.links);
          linksContainer.appendChild(icons);
          cardTitle.appendChild(linksContainer);
     }

     card.appendChild(cardTitle);

     const ImgElem = document.createElement('img');
     ImgElem.src = json.imageSrc;
     ImgElem.alt = json.imageTitle;
     ImgElem.className = 'project-card-img';
     card.appendChild(ImgElem);

     if (json.summary) {
          const p = document.createElement('p');
          p.textContent = json.summary;
          card.appendChild(p);
     }

     // if (json.technologies?.length) {
     //      const techContainer = document.createElement('div');
     //      techContainer.className = 'technologies-container';
     //      const builtWith = document.createElement('div');
     //      builtWith.className = 'technologies';
     //      builtWith.textContent = "Built With:";
     //      techContainer.appendChild(builtWith);
     //      json.technologies.forEach(tech => {
     //           const div = document.createElement('div');
     //           div.className = 'technologies';
     //           div.textContent = tech;
     //           techContainer.appendChild(div);
     //      });
     //      card.appendChild(techContainer);
     // }

     // if (json.tags?.length) {
     //      const tagsContainer = document.createElement('div');
     //      tagsContainer.className = 'tags-container';
     //      json.tags.forEach(tag => {
     //           const div = document.createElement('div');
     //           div.className = 'tags';
     //           div.textContent = tag;
     //           tagsContainer.appendChild(div);
     //      });
     //      card.appendChild(tagsContainer);
     // }

     container.appendChild(card);
}