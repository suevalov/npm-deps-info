import _ from 'lodash';
import { DEPS_GROUPS } from './utils';

export default (arg) => {
    let packages;

    if (_.isArray(arg)) {
        packages = arg;
    } else {
        packages = [ arg ];
    }

    const results = packages.map((packageJson) => {
        const deps = DEPS_GROUPS
            .map((group) => {
                const deps = packageJson[group.field];
                if (deps) {
                    return {
                        group: group.name,
                        list: deps
                    };
                }
            })
            .filter((chunk) => chunk)
            .map((chunk) => {
                return _.pairs(chunk.list).map((pair) => {
                    const [ name, version ] = pair;
                    return {
                        name,
                        version,
                        group: chunk.group
                    };
                });
            });

        return _.union(...deps);
    });

    const dictionary = {};

    results.forEach((pkg) => {
        pkg.forEach((dependency) => {
            if (dictionary[dependency.name]) {
                dictionary[dependency.name].version = [ ...dictionary[dependency.name].version, dependency.version ];
                dictionary[dependency.name].group = [ ...dictionary[dependency.name].group, dependency.group ];
                return;
            }
            dictionary[dependency.name] = dependency;
        });
    });

    return dictionary;

};
