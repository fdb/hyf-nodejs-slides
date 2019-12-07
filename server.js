const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

const app = express();
const port = process.env.PORT || 3000;

const MATCHING_COLORS = {
  '#11B5E4': '#eee',
  '#162521': '#eee',
  '#791E94': '#eee',
  '#23967F': '#222',
  '#E9806E': '#eee',
  '#F5F0F6': '#666'
};

const FONT_REGULAR = 'fonts/SourceSansPro-Regular.ttf';
const FONT_BOLD = 'fonts/SourceSansPro-Bold.ttf';
const FONT_MONO = 'fonts/SourceCodePro-Regular.ttf';
const FONT_MONO_BOLD = 'fonts/SourceCodePro-Bold.ttf';
const FONT_AWESOME = 'fonts/FontAwesome5-Solid.otf';

const PAGE_WIDTH = 800;
const PAGE_HEIGHT = 600;

const ICONS = {
  server: 0xf233,
  star: 0xf005,
  'angle-right': 0xf105,
}

class SlideGenerator {
  constructor(name, fgColor, bgColor) {
    this.name = name;
    this.fgColor = fgColor;
    this.bgColor = bgColor;
    this.genDate = new Date().toDateString();
    this._doc = new PDFDocument({ autoFirstPage: false });

  }

  pipe(dst) {
    this._doc.pipe(dst);
  }

  end() {
    this._doc.end();
  }

  _addIcon(name, fontSize, x, y) {
    const unicode = ICONS[name];
    this._doc.font(FONT_AWESOME).fontSize(fontSize).text(String.fromCharCode(unicode), x, y, { lineBreak: false });
  }

  _addSlide() {
    this._doc.addPage({ size: [PAGE_WIDTH, PAGE_HEIGHT], margins: 0 });
    this._doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(this.bgColor);
  }

  addTitleSlide(title, subTitle) {
    this._addSlide();
    this._doc.fillColor(this.fgColor).font(FONT_BOLD).fontSize(36).text(title, 50, 200, { lineBreak: false });
    if (subTitle) this._doc.fillColor(this.fgColor).font(FONT_REGULAR).fontSize(18).text(subTitle, 50, 250, { lineBreak: false });
  }

  addIntroSlide(title, subTitle) {
    this.addTitleSlide(title, subTitle);
    this._doc.fillColor(this.fgColor).font(FONT_REGULAR).fontSize(9).text(`Generated for ${this.name} on ${this.genDate}.`, 50, PAGE_HEIGHT - 30, { lineBreak: false });
  }

  addTextSlide(title, body) {
    this._addSlide();
    this._doc.fillColor(this.fgColor).font(FONT_BOLD).fontSize(36).text(title, 50, 50, { lineBreak: false });
    this._doc.fillColor(this.fgColor).font(FONT_REGULAR).fontSize(36).text(body, 50, 200, { lineBreak: true });
  }

  addQuoteSlide(title, body, cite) {
    this._addSlide();
    this._doc.fillColor(this.fgColor).font(FONT_BOLD).fontSize(36).text(title, 50, 50, { lineBreak: false });
    this._doc.fillColor(this.fgColor).font(FONT_REGULAR).fontSize(36).text(`“${body}”\n\n    — ${cite}`, 50, 200, { lineBreak: true });
  }

  addImageSlide(filename, attribution) {
    this._addSlide();
    this._doc.image(filename, { x: 50, y: 80, fit: [PAGE_WIDTH - 100, PAGE_HEIGHT - 160], align: 'center', valign: 'center' });
    this._doc.fillColor(this.fgColor).font(FONT_REGULAR).fontSize(9).text(attribution, 50, PAGE_HEIGHT - 50, { lineBreak: false });
  }

  addBulletsSlide(title, bullets) {
    this._addSlide();
    this._doc.fillColor(this.fgColor).font(FONT_BOLD).fontSize(36).text(title, 50, 50, { lineBreak: false });
    let y = 200;
    for (const bullet of bullets) {
      this._addIcon('angle-right', 10, 35, y + 8);
      this._doc.fillColor(this.fgColor).font(FONT_REGULAR).fontSize(18).text(bullet, 50, y, { lineBreak: false });
      y += 48;
    }
  }

  addCodeSlide(title, code, options) {
    let highlightLine = options && options.highlightLine;
    if (highlightLine) {
      highlightLine = Array.isArray(highlightLine) ? highlightLine : [highlightLine];
    } else {
      highlightLine = [];
    }
    const shouldHighlight = highlightLine.length > 0;
    this._addSlide();
    this._doc.fillColor(this.fgColor).font(FONT_BOLD).fontSize(36).text(title, 50, 50, { lineBreak: false });
    let y = 120;
    const lines = code.trim().split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNo = i + 1;
      const opacity = shouldHighlight && !highlightLine.includes(lineNo) ? 0.3 : 1.0;
      this._doc.fillColor(this.fgColor).font(FONT_MONO).opacity(0.2).fontSize(12).text(lineNo, 10, y + 2.5, { lineBreak: false, width: 20, align: 'right' });
      this._doc.fillColor(this.fgColor).font(FONT_MONO).opacity(opacity).fontSize(14).text(line, 50, y, { lineBreak: false });
      this._doc.opacity(1.0);
      y += 18;
    }
    const comment = options && options.comment;
    if (comment) {
      y += 24;
      this._doc.fillColor(this.fgColor).font(FONT_REGULAR).fontSize(18).text(comment, 50, y, { lineBreak: true });
    }
  }

}

app.get('/', async (req, res) => {
  const html = await readFileAsync('static/index.html', 'utf-8');
  res.end(html);
});

app.get('/slides', async (req, res) => {

  // Read settings from the user.
  const name = req.query.name || 'Stranger';
  const bgColor = req.query.color || '#fff';
  const fgColor = MATCHING_COLORS[bgColor] || '#fff';

  // Initialize the document.
  const slides = new SlideGenerator(name, fgColor, bgColor);
  slides.pipe(res);

  // Add slides.
  slides.addIntroSlide('Node.js', 'JavaScript on the Server');
  slides.addTitleSlide(`Hello ${name}!`, 'These slides are generated by Node.js.');

  slides.addTitleSlide('What is a server?');
  slides.addImageSlide('media/datacenter.jpg', '© Google Inc.');

  slides.addTitleSlide('Express');
  slides._addIcon('server', 100, 50, 250);

  slides.addBulletsSlide(`Express`, [
    'Turns Node.js into a web server.',
    'Provides support for request and response.',
    'Can generate HTML, JSON, static files, ...',
  ]);

  const codeHelloWorld = await readFileAsync('examples/hello-world.js', 'utf-8');
  slides.addCodeSlide('Basic server using Node.js / Express', codeHelloWorld);
  slides.addCodeSlide('Basic server using Node.js / Express', codeHelloWorld, { highlightLine: 1, comment: 'Import express.js from the node_modules folder. This assumes we used\n`npm install express` to install it as a dependency.' });
  slides.addCodeSlide('Basic server using Node.js / Express', codeHelloWorld, { highlightLine: 2, comment: 'Create an app object by calling express as a function. This creates our server.' });
  slides.addCodeSlide('Basic server using Node.js / Express', codeHelloWorld, { highlightLine: 3, comment: 'Each server listens on a specific port. Here we get the port from the environment variables, or use 3000 as the default.' });
  slides.addCodeSlide('Basic server using Node.js / Express', codeHelloWorld, { highlightLine: [5, 6, 7], comment: 'Listen to a GET request at the root. Whenever a user requests the home page, return "Hello World!". Note that this is not a HTML page.' });
  slides.addCodeSlide('Basic server using Node.js / Express', codeHelloWorld, { highlightLine: [9, 10, 11], comment: 'Start the server on the given port. Print out a message once the server has started.' });

  slides.addTitleSlide('Installing Node.js', 'https://nodejs.org/en/download/package-manager/');

  slides.addCodeSlide('Installing Node.js', `curl -sL https://deb.nodesource.com/setup_13.x | sudo -E bash -\nsudo apt-get install -y nodejs`);

  slides.addTitleSlide('What can a server do?');

  slides.addImageSlide('media/screenshot-facebook.png', 'Screenshot of the Facebook page.');
  slides.addImageSlide('media/screenshot-flights.png', 'Screenshot of the Jet Airways booking page.');
  slides.addImageSlide('media/screenshot-instagram-app.jpg', 'Screenshot of the Instagram app.');

  slides.addQuoteSlide('Web Server', 'The primary function of a web server is to store, process and deliver web pages to clients.', 'Wikipedia');

  const codeGenerateHTML = await readFileAsync('examples/generate-html.js', 'utf-8');
  slides.addCodeSlide('Express server returning HTML', codeGenerateHTML);
  slides.addCodeSlide('Express server returning HTML', codeGenerateHTML, { highlightLine: [6, 7], comment: 'We read in a query parameter from the URL, then write out a string containing HTML code.'});
  slides.addImageSlide('media/generate-html.png', 'Our HTML generating Express app.');

  const codeGenerateJSON = await readFileAsync('examples/generate-json.js', 'utf-8');
  slides.addCodeSlide('Express server returning JSON', codeGenerateJSON);
  slides.addCodeSlide('Express server returning JSON', codeGenerateHTML, { highlightLine: [6, 7, 8], comment: 'We write out a JSON object using res.json.'});
  slides.addImageSlide('media/generate-json.png', 'Postman, showing the result of our Express app.');

  const codeGeneratePDF = await readFileAsync('examples/generate-pdf.js', 'utf-8');
  slides.addCodeSlide('Express server returning PDF', codeGeneratePDF);
  slides.addCodeSlide('Express server returning PDF', codeGeneratePDF, { highlightLine: 2, comment: 'We need an extra dependency. We can install it using\n"npm install pdfkit".'});
  slides.addCodeSlide('Express server returning PDF', codeGeneratePDF, { highlightLine: [8, 9, 10, 11], comment: 'We create a new PDFKit document, write out a string and send the document to the client.'});
  slides.addImageSlide('media/generate-pdf.png', 'Generating a PDF file from Express using PDFKit.');

  slides.end();
});

app.listen(port, () => {
  console.log(`Slide generator listening on http://localhost:${port}/`)
});
