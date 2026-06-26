import app from '../app.js';

function listRoutes() {
  const stack = app._router.stack;
  const routes = [];
  for (const layer of stack) {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
      routes.push(`${methods} ${layer.route.path}`);
    } else if (layer.name === 'router' && layer.regexp) {
      routes.push(`<router> ${layer.regexp}`);
    }
  }
  console.log(routes.join('\n'));
}

listRoutes();
