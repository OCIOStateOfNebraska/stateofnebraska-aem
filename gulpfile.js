const uswds = require('@uswds/compile');

uswds.settings.version = 3;
uswds.paths.dist.theme = './uswds';
uswds.paths.dist.css = './styles/uswds';
uswds.paths.dist.js = './scripts';
uswds.paths.dist.img = './icons';
uswds.paths.dist.fonts = './fonts';

exports.init = uswds.init;
exports.compile = uswds.compile;
exports.watch = uswds.watch;