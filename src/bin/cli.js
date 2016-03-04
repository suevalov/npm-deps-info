#! /usr/bin/env node

import { resolve } from 'path';
import _ from 'lodash';

import { DEPS_GROUPS, getModuleInfo } from '../packageUtils';

(function main() {
    // Loading `package.json` from the current directory
    const packageFile = resolve('./package.json');
    let packageJson;
    try {
        packageJson = require(packageFile);
    } catch (err) {
        console.error(`Error loading package.json: ${err.message}`);
        process.exit(1);
    }

    let deps = DEPS_GROUPS
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

    deps = _.map(_.union(...deps), function* (dependency) {
        console.log(yield getModuleInfo(dependency.name));
        return dependency;
    });

//    console.log(deps);
})();
