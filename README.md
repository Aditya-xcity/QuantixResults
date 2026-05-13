# Result Easy Maker

Responsive Result Generator Website that creates a professional PDF marksheet.

Setup

1. Install dependencies

```bash
npm install
```

2. Run server

```bash
npm start
# or for development with auto-restart:
npm run dev
```

Open http://localhost:3000

Packages used

- express (server)
- nodemon (dev)
- jsPDF (included via CDN in index.html)
- jsPDF AutoTable plugin (included via CDN)

Project structure

- index.html
- style.css
- script.js
- server.js
- package.json

Notes

- The PDF is generated client-side using jsPDF. No personal data is uploaded to the server.
- The exact instructions required by the spec are included verbatim at the bottom of the generated PDF.
