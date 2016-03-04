import _ from 'lodash';
import npm from 'npm';

export const DEPS_GROUPS = [
    { name: 'production', field: 'dependencies' },
    { name: 'development', field: 'devDependencies' },
    { name: 'optional', field: 'optionalDependencies' }
];

export function getModuleHomepage(packageJson) {
    return packageJson.homepage || packageJson.url || null;
}

export const getModuleInfo = _.memoize(async moduleName =>
    await new Promise((resolve, reject) => {
        try {
            resolve('test' + moduleName);
            // // This function is only supposed to run after `npm-check-updates`, so we don't need to call `npm.load()` here
            // npm.commands.view([ moduleName ], true, (err, moduleInfo) => {
            //     if (err) {
            //         reject(err);
            //     } else {
            //         // `moduleInfo` contains object `{ <version>: <info> }`, so we should extract info from there
            //         resolve(_.values(moduleInfo)[0]);
            //     }
            // });
        } catch (err) {
            reject(err);
        }
    })
);
