const debug = require('debug')('bin:lib:register-partials');
const fs = require('fs');
const hbs = require('hbs');
const partialsPath = `${__dirname}/../../views/partials`;

module.exports = function(options){

	const location = options.directory || partialsPath;

	fs.readdirSync(location).forEach(partial => {
		const name = partial.replace('.hbs', '');
		hbs.registerPartial(name, require(`${location}/${name}.hbs`));
		debug(`Partial '${name}' registered`);
	});

}