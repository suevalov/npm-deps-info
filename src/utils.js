export const DEPS_GROUPS = [
    { name: 'production', field: 'dependencies' },
    { name: 'development', field: 'devDependencies' },
    { name: 'optional', field: 'optionalDependencies' }
];

export function callAsync(func, ...params) {
    return new Promise((resolve, reject) => {
        func(...params, (err, ...rest) => {
            if (err) {
                reject(err);
            }
            resolve(...rest);
        });
    });
}
