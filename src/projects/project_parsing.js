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

          // Links
          if (/^##\s+/.test(line)) {
               const matches = line.match(/https?:\/\/[^\s]+/g);
               if (matches) 
                    json.links = matches;
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

     // --- Parse blog (everything after blog marker) --- //
     const blogPart = md_raw.split('<!--BLOG SECTION BELOW-->')[1];
     if (blogPart) {
          json.blog = blogPart
               .split('\n\n')
               .map(p => p.trim())
               .filter(p => p);
     }

     return json;
}


export function renderProjectCard(json) {
     const container = document.getElementById('projects-container');
     console.log("ISNT RENDERED!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
     if (!container) return;

     const card = document.createElement('div');
     card.className = 'projectCard';

     const titleElem = document.createElement('h2');
     titleElem.textContent = json.title;
     card.appendChild(titleElem);


     //TODO: Re-Do this to dynamically assign a.textContent based on top-level domain name or, if it links to blog, just "Blog"
     if (json.links?.length) { 
          const linksContainer = document.createElement('div');
          linksContainer.className = 'links';
          json.links.forEach((url, i) => {
               const a = document.createElement('a');
               a.href = url;
               // Simple naming: first link → GitHub, second → Blog, else 'Link #'
               if (i === 0) a.textContent = 'GitHub';
               else if (i === 1) a.textContent = 'Blog';
               else a.textContent = `Link ${i + 1}`;
               a.target = '_blank';
               a.rel = 'noopener noreferrer';
               linksContainer.appendChild(a);
          });
          card.appendChild(linksContainer);
     }

     if (json.technologies?.length) {
          const techContainer = document.createElement('div');
          techContainer.className = 'technologies-container';
          json.technologies.forEach(tech => {
               const div = document.createElement('div');
               div.className = 'technologies';
               div.textContent = tech;
               techContainer.appendChild(div);
          });
          card.appendChild(techContainer);
     }

     if (json.tags?.length) {
          const tagsContainer = document.createElement('div');
          tagsContainer.className = 'tags-container';
          json.tags.forEach(tag => {
               const div = document.createElement('div');
               div.className = 'tags';
               div.textContent = tag;
               tagsContainer.appendChild(div);
          });
          card.appendChild(tagsContainer);
     }

     if (json.summary) {
          const p = document.createElement('p');
          p.textContent = json.summary;
          card.appendChild(p);
     }

     container.appendChild(card);
}