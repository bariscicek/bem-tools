var Q = require('q'),
	QFS = require('q-io/fs'),
	U = require('../util'),
	PATH = require('../path');

module.exports = function () {

	return this
		.title('BEM entities remove tool.')
		.helpful()
		.apply(U.chdirOptParse)
		.opt()
			.name('level')
			.title('default level')
			.short('l').long('level')
			.apply(U.applyLevelOpt('default level'))
			.end()
		.opt()
			.name('force')
			.title('directly remove entities without moving to .attic')
			.short('f').long('force')
			.flag()
			.end()
		.opt()
			.name('purge')
			.title('remove contents of .attic directory of level')
			.short('p').long('purge')
			.flag()
			.end()
		.arg()
			.name('entity')
			.title('BEM entity in the form of block__elem_mod_val.js')
			.val(bemParse)
			.end()
		.act(function (opts, args) {

			var	force = opts.force,
				purge = opts.purge,
				level = opts.level,
				entity = args.entity,
				items = getItems(level, entity),
				atticPath = PATH.join(level.dir, '.attic');

			if (purge) {
				/* remove the .attic directoy inside the level */
				return Q.when(QFS.isDirectory(atticPath), function (isDir) {
					if (isDir) {
						return QFS.removeTree(atticPath);
					}
				});
			}

			return Q.when(QFS.isDirectory(atticPath), function (isDir) {

					if (!isDir) {
						return QFS.makeDirectory(atticPath);
					}
			}).then(function() {

				var paths = items.map(function(item) {
					return getPath(level, item);
				});
				
				return Q.all(paths.map(function(path) {

					var	pathRel = PATH.relative(level.dir, path),
						pathTarget = PATH.join(atticPath, pathRel);

					return QFS.makeTree(QFS.directory(pathTarget)).then(function() {

						return QFS.move(path, pathTarget).then(function () {
							// remove left over directories if any
							return removeEmptyDirectory(path);
						})
					});
				})).get(0);
			});
			
		});
}

function getItems(level, item) {

    var exists = U.isDirectory (level.path);

    // If level directory does not exists return empty item list
    if (!exists) {
        return [];
    } else {
        return level.getItemsByIntrospection()
    .filter(function () { return true;});        
    }

}

function getPath(level, item) {
    return level.getByObj(item) + item.suffix;
}

function removeEmptyDirectory(source) {

    var path = Q.when (QFS.isDirectory (source), function (isDirectory) {

        if (!isDirectory) {
            return QFS.directory(source);
        } else {
            return source;
        }

    });

    return Q.when (path, function (path) {
        return QFS.list (path).then (function (list) {

            if (list.length == 0) {
                return Q.when(QFS.removeTree (path)).then (function () {

                    //call clearEmptyDirectory for parent in case this is the
                    //last file in the directory so it should be removed
                    var parent = QFS.join (path, '..');

                    return Q.fcall(removeEmptyDirectory, parent);
                }, function (err) {
                    // might not be able to remove directory be silent
                });

            } else {
                // not an empty directory but be silent
                return false;
            }
        });
    });
}


function bemParse(key) {

    var item = U.bemParseKey(key);

    // Try to get techs specified using dot notation
    if (item.tech) {
        item.techs = item.tech.split(',');
        delete item.tech;
    }

    return item;

}