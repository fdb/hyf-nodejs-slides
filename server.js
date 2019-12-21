const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

const app = express();
const port = process.env.PORT || 5555;

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

// From https://fontawesome.com/icons
const ICONS = {
  'heart': 0xf004,
  'star': 0xf005,
  'question-circle': 0xf059,
  'cogs': 0xf085,
  'stethoscope': 0xf0f1,
  'angle-right': 0xf105,
  'circle': 0xf111,
  'terminal': 0xf120,
  'code': 0xf121,
  'code-branch': 0xf126,
  'play-circle': 0xf144,
  'bug': 0xf188,
  'cubes': 0xf1b3,
  'file-pdf': 0xf1c1,
  'file-image': 0xf1c5,
  'file-code': 0xf1c9,
  'pencil-ruler': 0xf5ae,
  'server': 0xf233,
  'route': 0xf4d7,
  'dragon': 0xf6d5,
  'hammer': 0xf6e3,
};

function randomChoice(l) {
  return l[Math.floor(Math.random() * l.length)];
}

function random(min, max) {
  return min + Math.random() * (max - min);
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
    this._doc.addPage({ size: [PAGE_WIDTH, PAGE_HEIGHT], margin: 50 });
    this._doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(this.bgColor);
  }

  _addFootNote(text) {
    this._doc.fillColor(this.fgColor).font(FONT_REGULAR).fontSize(9).text(text, 50, PAGE_HEIGHT - 30, { lineBreak: false });
  }

  addTitleSlide(title, subTitle) {
    this._addSlide();
    this._doc.fillColor(this.fgColor).font(FONT_BOLD).fontSize(36).text(title, 50, 200, { lineBreak: false });
    if (subTitle) this._doc.fillColor(this.fgColor).font(FONT_REGULAR).fontSize(18).text(subTitle, 50, 250, { lineBreak: false });
  }

  addIconSlide(title, icon) {
    this._addSlide();
    this._doc.fillColor(this.fgColor).font(FONT_BOLD).fontSize(36).text(title, 50, 180, { width: PAGE_WIDTH - 100, align: 'center', lineBreak: false });
    this._addIcon(icon, 80, PAGE_WIDTH / 2 - 40, PAGE_HEIGHT / 2 - 40);
  }

  addIntroSlide(title, subTitle) {
    this.addTitleSlide(title, subTitle);
    this._addFootNote(`Generated for ${this.name} on ${this.genDate}.`);
  }

  addTextSlide(title, body, options) {
    const fontSize = options && options.fontSize || 36;
    this._addSlide();
    this._doc.fillColor(this.fgColor).font(FONT_BOLD).fontSize(36).text(title, 50, 50, { lineBreak: false });
    this._doc.fillColor(this.fgColor).font(FONT_REGULAR).fontSize(fontSize).text(body, 50, 200, { lineBreak: true });
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
    let fontSize = options && options.fontSize || 14;
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
      this._doc.fillColor(this.fgColor).font(FONT_MONO).opacity(0.2).fontSize(fontSize - 2).text(lineNo, 10, y + 2.5, { lineBreak: false, width: 20, align: 'right' });
      this._doc.fillColor(this.fgColor).font(FONT_MONO).opacity(opacity).fontSize(fontSize).text(line, 50, y, { lineBreak: false });
      this._doc.opacity(1.0);
      y += 18;
    }
    const comment = options && options.comment;
    if (comment) {
      y += 24;
      let inCode = false;
      this._doc.x = 50;
      this._doc.y = y;
      for (const part of comment.split('`')) {
        const font = inCode ? FONT_MONO_BOLD : FONT_REGULAR;
        this._doc.fillColor(this.fgColor).font(font).fontSize(18).text(part, { lineBreak: true, continued: true });
        inCode = !inCode;
      }
      // To avoid the last `continued` option.
      this._doc.text('');
    }
  }

}

app.get('/', async (req, res) => {
  const html = await readFileAsync('static/index.html', 'utf-8');
  res.end(html);
});

app.get('/slides', async (req, res) => {
  // Read settings from the user.
  const week = parseInt(req.query.week || '1');
  const name = req.query.name || 'Stranger';
  const bgColor = req.query.color || '#fff';
  const fgColor = MATCHING_COLORS[bgColor] || '#fff';

  // Initialize the document.
  const slides = new SlideGenerator(name, fgColor, bgColor);
  slides.pipe(res);

  slides.addIntroSlide(`Node.js — Week ${week}`, 'Hack Your Future Belgium');

  if (week === 1) {
    await _generateWeek1Slides(slides, name);
  } else if (week === 2) {
    await _generateWeek2Slides(slides, name);
  } else if (week === 3) {
    await _generateWeek3Slides(slides, name);
  }

  slides.end();
});


async function _generateWeek1Slides(slides, name) {
  // Add the "rainbow" slide.
  slides._addSlide();
  const colors = Object.keys(MATCHING_COLORS);
  colors.splice(colors.length - 1, 1);
  const stripeWidth = PAGE_WIDTH / 8;
  const stripeHeight = PAGE_HEIGHT / 6;
  for (let y = 0; y < PAGE_HEIGHT; y += stripeHeight) {
    for (let x = 0; x < PAGE_WIDTH; x += stripeWidth) {
      const color = randomChoice(colors);
      slides._doc.rect(x + 5, y + 5, stripeWidth - 10, stripeHeight - 10).fill(color);
    }
  }
  slides._doc.fillColor(slides.bgColor).font(FONT_BOLD).fontSize(36).text(`Hello ${name}!`, stripeWidth + 1, stripeHeight + 11, { lineBreak: false });
  slides._doc.fillColor(slides.fgColor).font(FONT_BOLD).fontSize(36).text(`Hello ${name}!`, stripeWidth, stripeHeight + 10, { lineBreak: false });
  slides._doc.fillColor(slides.bgColor).font(FONT_REGULAR).fontSize(18).text('These slides are generated by Node.js.', stripeWidth + 1, stripeHeight + 51, { lineBreak: false });
  slides._doc.fillColor(slides.fgColor).font(FONT_REGULAR).fontSize(18).text('These slides are generated by Node.js.', stripeWidth, stripeHeight + 50, { lineBreak: false });

  slides.addTitleSlide('What is a server?');
  slides.addImageSlide('media/datacenter1.jpg', 'Data center in The Dalles, Oregon. © Google Inc.');
  slides.addImageSlide('media/datacenter2.jpg', 'Data center in St. Ghislain, Belgium. © Google Inc.');

  slides.addIconSlide('Express', 'server');

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

 slides.addBulletsSlide('Demo Time!', [
    'Use Node.js in interactive (REPL) mode.',
    'Run a simple server.',
    'Use nodemon to restart the server automatically.',
  ]);

  slides.addIconSlide('What can a server do?', 'question-circle');

  slides.addImageSlide('media/screenshot-facebook.png', 'Screenshot of the Facebook page.');
  slides.addImageSlide('media/screenshot-flights.png', 'Screenshot of the Jet Airways booking page.');
  slides.addImageSlide('media/screenshot-instagram-app.jpg', 'Screenshot of the Instagram app.');

  slides.addQuoteSlide('Web Server', 'The primary function of a web server is to store, process and deliver web pages to clients.', 'Wikipedia');

  const codeGenerateHTML = await readFileAsync('examples/generate-html.js', 'utf-8');
  slides.addCodeSlide('Express server returning HTML', codeGenerateHTML);
  slides.addCodeSlide('Express server returning HTML', codeGenerateHTML, { highlightLine: [6, 7], comment: 'We read in a query parameter from the URL, then write out a string containing HTML code.'});
  slides.addImageSlide('media/generate-html.png', 'Our HTML generating Express app.');

  slides.addIconSlide('Templates', 'code');

  const codeTemplates = await readFileAsync('examples/templates.js', 'utf-8');
  slides.addCodeSlide('HTML Templates', codeTemplates);
  slides.addCodeSlide('HTML Templates', codeTemplates, { highlightLine: 1, comment: 'We use Handlebars to generate HTML code for us.'});
  slides.addCodeSlide('HTML Templates', codeTemplates, { highlightLine: [3, 4, 5, 6, 7, 8, 9, 10], comment: 'We define a template, basically a string with HTML code and special markup for Handlebars.'});
  slides.addCodeSlide('HTML Templates', codeTemplates, { highlightLine: [6, 8], comment: 'This is how we define a loop in Handlebars. It will read a list stored in `predictions` and generate this code for every prediction.'});
  slides.addCodeSlide('HTML Templates', codeTemplates, { highlightLine: 7, comment: 'This is what we generate. The `{{name}}` tags are filled in with the value of the variable.'});
  slides.addCodeSlide('HTML Templates', codeTemplates, { highlightLine: [12, 13, 14, 15, 16, 17], comment: 'This is our "database" of predictions. In real life they would come from an API or database somewhere.'});
  slides.addCodeSlide('HTML Templates', codeTemplates, { highlightLine: [18, 19, 20], comment: 'Compile the template and turn it into a function. Then call this function with our database and print out the results.'});

  slides.addIconSlide('Static Files', 'file-image');

  const codeStaticFiles = await readFileAsync('examples/static-files.js', 'utf-8');
  slides.addCodeSlide('Static Files', codeStaticFiles);
  slides.addCodeSlide('Static Files', codeStaticFiles, { highlightLine: 4, comment: 'This line maps all files in the images folder under `/static`.'});
  slides.addCodeSlide('Static Files', codeStaticFiles, { highlightLine: 9, comment: 'Here we refer to the image using the `<img>` tag. Note the `/static`.'});
  slides.addImageSlide('media/static-files.jpg', 'Our simple app showing the image. Cat image by Ramiz Dedaković on Unsplash.');

  slides.addIconSlide('API Server', 'cogs');

  const codeGenerateJSON = await readFileAsync('examples/generate-json.js', 'utf-8');
  slides.addCodeSlide('Express server returning JSON', codeGenerateJSON);
  slides.addCodeSlide('Express server returning JSON', codeGenerateJSON, { highlightLine: [6, 7, 8], comment: 'We write out a JSON object using `res.json`.'});
  slides.addImageSlide('media/generate-json.png', 'Postman, showing the result of our Express app.');

  slides.addIconSlide('Routing', 'route');

  const codeBasicRoutes = await readFileAsync('examples/routes-basic.js', 'utf-8');
  slides.addCodeSlide('Basic Routes', codeBasicRoutes);
  slides.addCodeSlide('Basic Routes', codeBasicRoutes, { highlightLine: [5, 6, 7], comment: 'This is the first route when we ask for `/users`.'});
  slides.addCodeSlide('Basic Routes', codeBasicRoutes, { highlightLine: [9, 10, 11], comment: 'This is the second route when we ask for `/projects`.'});

  const codePizzaRoutes = await readFileAsync('examples/routes-pizza.js', 'utf-8');
  slides.addCodeSlide('Dynamic Routes', codePizzaRoutes);
  slides.addCodeSlide('Dynamic Routes', codePizzaRoutes, { highlightLine: [5, 6, 7, 8], comment: 'This is our "database". We\'ll talk more about databases in the next module.'});
  slides.addCodeSlide('Dynamic Routes', codePizzaRoutes, { highlightLine: [10, 14], comment: 'This is our route. Note the `:kind`. This stores part of the URL under `req.params.kind`.'});
  slides.addCodeSlide('Dynamic Routes', codePizzaRoutes, { highlightLine: 11, comment: 'Here we use `req.params.kind` as a lookup key in our "database".'});
  slides.addCodeSlide('Dynamic Routes', codePizzaRoutes, { highlightLine: 12, comment: 'If we can\'t find it we return a "notfound" status message.'});
  slides.addCodeSlide('Dynamic Routes', codePizzaRoutes, { highlightLine: 13, comment: 'Otherwise we return "ok" with the pizza object spliced in.'});

  slides.addImageSlide('media/routes-pizza.png', 'Screenshot of Postman showing our route.');
}

async function _generateWeek2Slides(slides, name) {
  slides.addBulletsSlide('Week 2 Plan', [
    'Node.js on the command line',
    'Reading and Writing files',
    'Modules and require',
    'Node.js event loop',
    'Homework: DIY Wiki',
  ]);

  slides.addIconSlide('Node.js on the command line', 'terminal');

  slides.addTextSlide('Servers optional', 'In addition to servers, Node.js can be used to write command line tools.\n\nI use it to convert data, scrape websites, or generate images.');

  slides.addIconSlide('Reading and Writing files', 'file-code');

  const readFileSimple = await readFileAsync('examples/read-file-simple.js', 'utf-8');
  slides.addCodeSlide('Reading a Simple File', readFileSimple);
  slides.addCodeSlide('Reading a File', readFileSimple, { highlightLine: 1, comment: 'We import `fs`. We\'ll use promises and async/await.'});
  slides.addCodeSlide('Reading a File', readFileSimple, { highlightLine: 8, comment: 'Get the name of the file from the command line arguments. We can access them using `process.argv`. Argument 0 = `node`, argument 1 = `read-file-simple.js`, argument 2 = your custom args.'});
  slides.addCodeSlide('Reading a File', readFileSimple, { highlightLine: [9, 3, 6], comment: 'We call our function with the filename argument.'});
  slides.addCodeSlide('Reading a File', readFileSimple, { highlightLine: 4, comment: 'Read in the file. Note that we have to `await`. The `\'utf-8\'` parameter is necessary, otherwise Node.js returns a `Buffer` object, not a string.'});
  slides.addCodeSlide('Reading a File', readFileSimple, { highlightLine: 5, comment: 'Log out the text.'});

  const readQuotesFile = await readFileAsync('examples/read-file-quotes.js', 'utf-8');
  slides.addCodeSlide('Choosing a Quote', readQuotesFile);
  slides.addCodeSlide('Choosing a Quote', readQuotesFile, { highlightLine: [1, 2], comment: 'We import both `fs` and `path`. We\'ll use promises and async/await.'});
  slides.addCodeSlide('Choosing a Quote', readQuotesFile, { highlightLine: 10, comment: 'First let\'s find the correct location of the file. Use `path.join` to combine parts of the path in a platform-independent way.'});
  slides.addCodeSlide('Choosing a Quote', readQuotesFile, { highlightLine: 11, comment: 'Read in the file. Note that we have to `await`. The `\'utf-8\'` parameter is necessary, otherwise Node.js returns a `Buffer` object, not a string.'});
  slides.addCodeSlide('Choosing a Quote', readQuotesFile, { highlightLine: 12, comment: 'Remove the last new lines so splitting into quotes doesn\'t return a last empty line.'});
  slides.addCodeSlide('Choosing a Quote', readQuotesFile, { highlightLine: 13, comment: 'Split the text into multiple lines.'});
  slides.addCodeSlide('Choosing a Quote', readQuotesFile, { highlightLine: 14, comment: 'Choose a quote. `choice` is not implemented so let\'s do it ourselves!'});
  slides.addCodeSlide('Choosing a Quote', readQuotesFile, { highlightLine: [4, 5, 6, 7], comment: 'JS only provides `Math.random` which returns values between 0-1. Multiply these with the length of the array and chop of the floating point. Use that as the index.'});
  slides.addCodeSlide('Choosing a Quote', readQuotesFile, { highlightLine: 15, comment: 'Log out the chosen quote.'});
  slides.addCodeSlide('Choosing a Quote', readQuotesFile, { highlightLine: [9, 16, 18], comment: 'Why do we use main here? We need a function to be able to use `async`/`await`. We\'ll talk about this later.'});


  slides.addBulletsSlide('Exercise: writing a file', [
    'Read in a file, convert it the text to uppercase, then write it out.',
    'The input and output filenames come from the command line (process.argv).',
    'Lookup how to write a file using Node.js in the documentation: https://nodejs.org/api/'
  ]);

  // const codeEncrypt = await readFileAsync('examples/encrypt.js', 'utf-8');
  // slides.addCodeSlide('Command Line "Encryption" Tool', codeEncrypt);
  // slides.addCodeSlide('Command Line "Encryption" Tool', codeEncrypt, { highlightLine: 1, comment: 'We need "fs", which is the file system module built into Node.js. We\'ll use promises and async/await.'});
  // slides.addCodeSlide('Command Line "Encryption" Tool', codeEncrypt, { highlightLine: 4, comment: 'Read in the file to `encrypt`.'});
  // slides.addCodeSlide('Command Line "Encryption" Tool', codeEncrypt, { highlightLine: 5, comment: 'Convert the text to capital letters.'});
  // slides.addCodeSlide('Command Line "Encryption" Tool', codeEncrypt, { highlightLine: [7, 14], comment: 'Loop through all the letters of the text.'});
  // slides.addCodeSlide('Command Line "Encryption" Tool', codeEncrypt, { highlightLine: [8, 12], comment: 'We only convert letters and leave other characters as-is.'});
  // slides.addCodeSlide('Command Line "Encryption" Tool', codeEncrypt, { highlightLine: [9, 10, 11], comment: 'Perform our encryption magic. (This is the Caesar cipher. Look it up!)'});
  // slides.addCodeSlide('Command Line "Encryption" Tool', codeEncrypt, { highlightLine: [6, 13], comment: 'Add each letter to a new string called `output`.'});
  // slides.addCodeSlide('Command Line "Encryption" Tool', codeEncrypt, { highlightLine: 15, comment: 'Print out the output string. We could write it to a file as well if we wanted to.'});
  // slides.addCodeSlide('Command Line "Encryption" Tool', codeEncrypt, { highlightLine: 18, comment: '`process.argv` is a list of our command line arguments. Argument 2 is the filename.'});

  slides.addTitleSlide(`Thanks ${name}!`);
  for (let i = 0; i < 100; i++) {
    const size = randomChoice([12, 24, 36, 48]);
    const x = random(-size, PAGE_WIDTH);
    const y = random(-size, PAGE_HEIGHT);
    slides._doc.opacity(0.2);
    slides._addIcon('heart', size, x, y);
    slides._doc.opacity(1.0);
  }
  slides._addFootNote('Code: https://github.com/fdb/hyf-nodejs-slides');
}


async function _generateWeek3Slides(slides, name) {
  slides.addBulletsSlide('Week 3 Plan', [
    'Homework Review',
    'Debugging Techniques',
    'Modules and require',
    'Node.js event loop',
    'Homework: DIY Wiki Part #2',
  ]);

  slides.addIconSlide('Homework Review', 'pencil-ruler');


  slides.addIconSlide('Debugging Techniques', 'bug');
  slides.addTextSlide('Debugging Techniques', 'Debugging is more than \n"making the bug go away."', { fontSize: 48 });

  slides.addBulletsSlide('Debugging Techniques', [
    'Work out *why* the software is behaving unexpectedly.',
    'Fix the problem.',
    'Avoid breaking anything else.',
    'Maintain or improve the code quality.',
    'Ensure the same problem does not occur elsewhere / again.'
  ]);

  slides.addBulletsSlide('Core Debugging Process', [
    'Reproduce',
    'Diagnose',
    'Fix',
    'Reflect',
  ]);

  slides.addIconSlide('Reproduce', 'play-circle');

  slides.addBulletsSlide('Reproducing', [
    'Reproduce first, ask questions later',
    'Start with the obvious',
    'Control the software',
    'Control the environment',
    'Control the inputs',
    'As simple as possible',
  ]);

  slides.addTextSlide('Reproduce first', 'Don\'t start fixing things unless you know what the problem is.', { fontSize: 48 });

  slides.addTextSlide('Start with the obvious', 'Read the bug reports.', { fontSize: 48 });
  slides.addTextSlide('Control the software', 'Use the same version!', { fontSize: 48 });
  slides.addTextSlide('Control the environment', 'Use the same OS / Browser.', { fontSize: 48 });
  slides.addTextSlide('Control the inputs', 'Track the inputs if possible (using sentry.io)', { fontSize: 48 });
  slides.addTextSlide('As simple as possible', 'Remove everything that\'s not needed to trigger the bug.', { fontSize: 48 });

  slides.addIconSlide('Diagnose', 'stethoscope');

  slides.addTextSlide('Diagnose', 'Use the Scientific Method. Have a hypothesis and test it.', { fontSize: 48 });

  const bugsBodyBody1 = await readFileAsync('examples/bugs-body-body-1.js', 'utf-8');
  const bugsBodyBody2 = await readFileAsync('examples/bugs-body-body-2.js', 'utf-8');
  const bugsBodyBody3 = await readFileAsync('examples/bugs-body-body-3.js', 'utf-8');
  const bugsBodyBody4 = await readFileAsync('examples/bugs-body-body-4.js', 'utf-8');
  slides.addCodeSlide('Example: [object Object]', bugsBodyBody1);
  slides.addCodeSlide('Example: [object Object]', bugsBodyBody2);
  slides.addCodeSlide('Example: [object Object]', bugsBodyBody2, { highlightLine: [3, 4], comment: 'Split out the req.body into its own variable so we can log it.' });
  slides.addCodeSlide('Example: [object Object]', bugsBodyBody3);
  slides.addCodeSlide('Example: [object Object]', bugsBodyBody3, { highlightLine: 4, comment: 'Verify the *shape* of the object.' });
  slides.addCodeSlide('Example: [object Object]', bugsBodyBody3, { highlightLine: 4, comment: 'Output: [ \'body\' ]' });
  slides.addCodeSlide('Example: [object Object]', bugsBodyBody4);

  slides.addTextSlide('Diagnose', 'Divide and Conquer: the "binary chop" method', { fontSize: 48 });

  const bugsHtmlEntities = await readFileAsync('examples/bugs-html-entities-1.js', 'utf-8');
  slides.addCodeSlide('Example: empty page', bugsHtmlEntities);
  slides.addImageSlide('media/bugs-html-entities-dom.png');
  slides.addImageSlide('media/bugs-html-entities-network.png');
  slides.addImageSlide('media/bugs-html-entities-fixed.png');

  slides.addTextSlide('Diagnose', 'Are you changing the right thing?', { fontSize: 48 });

  const bugsCssNoEffect1 = await readFileAsync('examples/bugs-css-no-effect-1.txt', 'utf-8');
  const bugsCssNoEffect2 = await readFileAsync('examples/bugs-css-no-effect-2.txt', 'utf-8');
  const bugsCssNoEffect3 = await readFileAsync('examples/bugs-css-no-effect-3.txt', 'utf-8');
  slides.addCodeSlide('Example: Font does not work', bugsCssNoEffect1, { fontSize: 9.5 });
  slides.addCodeSlide('Example: Font does not work', bugsCssNoEffect2, { fontSize: 9.5 });
  slides.addCodeSlide('Example: Font does not work', bugsCssNoEffect2, { fontSize: 9.5, highlightLine: 8 });
  slides.addCodeSlide('Example: Font does not work', bugsCssNoEffect3, { fontSize: 9.5, highlightLine: 8 });

  slides.addIconSlide('Rubber Duck Debugging', 'dragon');

  slides.addIconSlide('Fix', 'hammer');

  slides.addBulletsSlide('Fix', [
    'Fix the problem.',
    'Avoid introducing regressions.',
    'Maintain or improve the code quality.'
  ]);

  slides.addTextSlide('Fix', 'Write a test that fails, then fix it so it passes.', { fontSize: 24 });
  
  slides.addIconSlide('Reflect', 'circle');  


  slides.addBulletsSlide('Make sure that it doesn\'t happen again', [
    'Coding standards',
    'Testing standards',
    'Documentation standards',
    'Reporting / Tracking',
  ]);

  slides.addIconSlide('Modules and require', 'cubes');

  slides.addTextSlide('Node.js Modules', 'When projects become bigger, we use modules to split them up.', { fontSize: 24 });
  slides.addTextSlide('Node.js Modules', 'When you import external codes, you also use modules.', { fontSize: 24 });
  slides.addTextSlide('Node.js Modules', 'There\'s not much difference between your own modules and imported modules.', { fontSize: 24 });

  const codeModulesIndex = await readFileAsync('examples/modules/index.js', 'utf-8');
  slides.addCodeSlide('Modules: index.js', codeModulesIndex);
  slides.addCodeSlide('Modules: index.js', codeModulesIndex, { highlightLine: 1, comment: 'Import something from our own module. Note the `./` syntax to import from your local directory instead of node_modules.'});
  slides.addCodeSlide('Modules: index.js', codeModulesIndex, { highlightLine: 4, comment: 'Use the function to reverse the string.'});

  const codeModulesStringUtils = await readFileAsync('examples/modules/string-utils.js', 'utf-8');
  slides.addCodeSlide('Modules: string-utils.js', codeModulesStringUtils);
  slides.addCodeSlide('Modules: string-utils.js', codeModulesStringUtils, { highlightLine: 1, comment: 'We need to be explicit on which functions from a file to export. We can assign it to `exports` like here, or use `module.exports`.'});
  slides.addCodeSlide('Modules: string-utils.js', codeModulesStringUtils, { highlightLine: [2, 3, 4, 5, 6], comment: 'Use a regular for loop to reverse the string.'});

  slides.addTitleSlide('The Node Event Loop');
  slides.addImageSlide('media/node-event-loop.png', 'From "Building a Network Application with Node"');

  slides.addTextSlide('The Fast Food Restaurant Analogy', 'As soon as you place your order, it’s sent off for someone to fulfill while the cashier is still taking your payment. When you are done paying, you have to step aside because the cashier is already looking to service the next customer. In some restaurants, you might even be given a pager that will flash and vibrate when your order is ready for pickup.  The key point is that you are not blocking the receiving of new orders.', { fontSize: 24 });
  slides._addFootNote('http://code.danyork.com/2011/01/25/node-js-doctors-offices-and-fast-food-restaurants-understanding-event-driven-programming/');

  const codeCallbacks = await readFileAsync('examples/callbacks.js', 'utf-8');
  slides.addCodeSlide('Node.js runs on callbacks', codeCallbacks);
  slides.addCodeSlide('Node.js runs on callbacks', codeCallbacks, { highlightLine: [3, 9], comment: 'The last argument of `readFile` is a callback function that gets executed when the file has been read (or an error has happened).'});
  slides.addCodeSlide('Node.js runs on callbacks', codeCallbacks, { highlightLine: [4, 5, 6, 7], comment: 'We check and report the error.'});
  slides.addCodeSlide('Node.js runs on callbacks', codeCallbacks, { highlightLine: 8, comment: 'Finally we can do something with the contents of the file.'});

  const codeCallbackHell = await readFileAsync('examples/callback-hell.js', 'utf-8');
  slides.addCodeSlide('Callback Hell', codeCallbackHell);
  slides.addCodeSlide('Callback Hell', codeCallbackHell, { highlightLine: [3, 13], comment: 'This is the main function...'});
  slides.addCodeSlide('Callback Hell', codeCallbackHell, { highlightLine: [4, 12], comment: 'This function checks if the file exists...'});
  slides.addCodeSlide('Callback Hell', codeCallbackHell, { highlightLine: [6, 11], comment: 'This reads the input file...'});
  slides.addCodeSlide('Callback Hell', codeCallbackHell, { highlightLine: [8, 10], comment: 'This writes the output file...'});
  slides.addCodeSlide('Callback Hell', codeCallbackHell, { highlightLine: [10, 11, 12, 13], comment: 'WHAT IS THIS VOODOO MAGIC *?$!'});

  const codePromises = await readFileAsync('examples/promises.js', 'utf-8');
  slides.addCodeSlide('Promises', codePromises);
  slides.addCodeSlide('Promises', codePromises, { highlightLine: [5, 6, 10, 11], comment: 'The readFile returns a `Promise`. We use `then` and `catch` on the result.'});
  slides.addCodeSlide('Promises', codePromises, { highlightLine: [7, 8, 9], comment: 'writeFile also returns a `Promise`.'});
  slides.addCodeSlide('Promises', codePromises, { highlightLine: [4, 8, 12], comment: 'writeFile does not return, but calls the `resolve` function we got when creating a new promise.'});

  const codeAsyncAwait = await readFileAsync('examples/async-await.js', 'utf-8');
  slides.addCodeSlide('Async / Await', codeAsyncAwait);
  slides.addCodeSlide('Async / Await', codeAsyncAwait, { highlightLine: 5, comment: 'This is the same `readFile`, but we just use await instead of `then()`.'});
  slides.addCodeSlide('Async / Await', codeAsyncAwait, { highlightLine: 5, comment: 'The same goes for `writeFile`.'});
  slides.addCodeSlide('Async / Await', codeAsyncAwait, { highlightLine: [4, 8, 9, 10], comment: 'Error handling happens in try/catch, just like normal JavaScript code.'});
  slides.addCodeSlide('Async / Await', codeAsyncAwait, { highlightLine: 3, comment: 'Note that you can only use `await` in a function that is tagged with `async`.'});

  slides.addIconSlide('External APIs', 'code-branch');
  const codeGithub = await readFileAsync('examples/request-github.js', 'utf-8');
  slides.addCodeSlide('Requesting other APIs', codeGithub);
  slides.addCodeSlide('Requesting other APIs', codeGithub, { highlightLine: 2, comment: 'We use the "request" and "request-promise-native" modules.'});
  slides.addCodeSlide('Requesting other APIs', codeGithub, { highlightLine: [8, 9, 10, 11, 12], comment: 'We build an options object to give to Request. It contains the URL, User-Agent headers, and an option to automatically convert to JSON.'});
  slides.addCodeSlide('Requesting other APIs', codeGithub, { highlightLine: 13, comment: 'Fire off the request. This can take some time but because of the Node.js event loop, other requests can keep coming in.'});
  slides.addCodeSlide('Requesting other APIs', codeGithub, { highlightLine: 14, comment: 'Do something with the response and send it to our client.'});

  slides.addIconSlide('PDF Generation', 'file-pdf');
  const codeGeneratePDF = await readFileAsync('examples/generate-pdf.js', 'utf-8');
  slides.addCodeSlide('Express server returning PDF', codeGeneratePDF);
  slides.addCodeSlide('Express server returning PDF', codeGeneratePDF, { highlightLine: 2, comment: 'We need an extra dependency. We can install it using `npm install pdfkit`.'});
  slides.addCodeSlide('Express server returning PDF', codeGeneratePDF, { highlightLine: [8, 9, 10, 11], comment: 'We create a new PDFKit document, write out a string and send the document to the client.'});
  slides.addImageSlide('media/generate-pdf.png', 'Generating a PDF file from Express using PDFKit.');
  slides.addImageSlide('media/pdf-invoice.png', 'This is used to generate PDF invoices, for example (Example: Prince by YesLogic).');
}

app.listen(port, () => {
  console.log(`Slide generator listening on http://localhost:${port}/`)
});
