const handlebars = require("handlebars");

const TEMPLATE = `
<h1>Weather Predictions</h1>
<ul>
  {{#predictions}}
  <li>{{name}}: {{pred}}</li>
  {{/predictions}}
</ul>
`;

const predictions = [
  { name: 'Brussels', pred: 'rainy' },
  { name: 'London',   pred: 'thunderstorm' },
  { name: 'Paris',    pred: 'sunny' }
];

const template = handlebars.compile(TEMPLATE);
const html = template({ predictions });
console.log(html);
