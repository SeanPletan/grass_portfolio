import md_raw from "./test.md?raw"

export default function projectParser() {
     const json = [];
     const lines = md_raw.split("\n");
     let data = "";


     for (let line of lines) {
          line = line.trim();

          if (line.startsWith('#')) {
               const title = line.match(/^#\s+(.*)/);
               let links = null;
               let technologies = null;
               let tags = null;


               if (title) {
                    data = title[1];
                    json.push({ type: 'title', data });
                    continue;
               }
               if (/^#{2}\s/.test(line)) {
                    links = line.match(/https?:\/\/[^\s]+/g);
                    data = links;
                    json.push({ type: 'links', data});
                    continue;
               }
               if (/^#{3}\s/.test(line)) {
                    technologies = line.match(/'([^']+)'/g);
                    technologies = technologies.map(tag => tag.replace(/^'|'$/g, ''));
                    data = technologies;
                    json.push({ type: 'technologies', data });
                    continue;
               }
               if (/^#{4}\s/.test(line)) {
                    tags = line.match(/'([^']+)'/g);
                    tags = tags.map(tag => tag.replace(/^'|'$/g, ''));
                    data = tags;
                    json.push({ type: 'tags', data });
                    continue;
               }
          }

          else if (line.includes('<!--BLOG SECTION BELOW-->'))
               break;
     }

     const summaryLine = md_raw
          .split('\n')
          .map(line => line.trim())
          .find(line => line.toLowerCase().startsWith('summary:'));

     if (summaryLine) {
          data = summaryLine.replace(/^summary:\s*/i, '');
          json.push({ type: 'summary', data });
     }


     //console.log(JSON.stringify(json, null, 2));
     return json;
}