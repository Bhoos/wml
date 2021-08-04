'use strict';

var path = require('path');
var fs = require('fs-extra');

const { S_IRUSR, S_IRGRP, S_IROTH } = require('constants');

module.exports = function (config) {
	// Check for ignore_dirs and avoid copying ignored directory path
	const configFile = path.join(config.src, '.watchmanconfig');
	let ignoreDirs = null;
	if (fs.existsSync(configFile)) {
		const config = fs.readJSONSync(configFile);
		ignoreDirs = config && config.ignore_dirs && config.ignore_dirs.map(k => k + path.sep);
	}
	
	return function (resp) {
		for (var i in resp.files) {
			var f = resp.files[i];
			if (f.type === 'f') {
				if (ignoreDirs && ignoreDirs.find(dir => f.name.startsWith(dir))) {
					console.log('[ignore]', f.name);
					continue;
				}

				let src = path.join(config.src, f.name),
				    dest = path.join(config.dest, f.name);

				if (f.exists) {
					console.log('[copy]', src, '->', dest);
					fs.copy(src, dest, (err) => {
						if (!err) {
							fs.chmod(dest, S_IRUSR | S_IRGRP | S_IROTH);
						}
					});
				} else {
					console.log('[delete]', dest);
					fs.remove(dest);
				}
			}
		}
	}
}
